#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// ===== WiFi & MQTT Config =====
const char* ssid = "DGB";
const char* password = "06102004";
const char* mqtt_server = "172.20.10.2"; 
const int mqtt_port = 1884;
const char* mqtt_user = "tripled";     
const char* mqtt_pass = "842004";

// ===== Hardware Pins =====
#define DHTPIN 4
#define DHTTYPE DHT22
#define AO 34         // Cảm biến ánh sáng
#define BUZZER_PIN 25 // Còi báo động tại chỗ

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

unsigned long previousMillis = 0;
const long interval = 2000; // Chu kỳ đọc 2 giây

// Biến phục vụ dự đoán xu hướng tăng nhiệt đột ngột
float prevTemp = -999.0;
unsigned long lastAlertMillis = 0;
const long alertCooldown = 10000; // Giãn cách gửi cảnh báo 10s/lần để tránh spam DB

// Ngưỡng cảnh báo phòng thực hành
const float TEMP_DANGER = 50.0;     // Nhiệt độ cháy nổ nguy hiểm (°C)
const float TEMP_WARNING = 40.0;    // Nhiệt độ cảnh báo sớm (°C)
const float TEMP_RATE_SPIKE = 3.0;  // Nhiệt độ tăng đột ngột >= 3°C trong 2 giây
const float HUMIDITY_LOW = 25.0;    // Độ ẩm hanh khô dễ bén lửa (%)
const int LIGHT_FLASH = 3500;       // Lóe sáng bất thường / tia lửa (lux)

void setup_wifi() {
  Serial.begin(115200);
  Serial.print("Connecting to WiFi: ");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void reconnect() {
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP-LabMonitor-" + String(random(0xffff), HEX);
    
    if (mqttClient.connect(clientId.c_str(), mqtt_user, mqtt_pass, "home/status", 0, true, "offline")) {
      Serial.println("connected");
      mqttClient.publish("home/status", "online", true);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      delay(5000);
    }
  }
}

float readLux(int analogValue) {
  const float Vmax = 5.0;
  const int ADC_MAX = 4095;
  const float R = 10000.0;
  const float A = 500000.0;
  const float B = 1.4;
  float V0 = ((float)analogValue / ADC_MAX) * Vmax;
  if (V0 <= 0.0) return 0.0;
  float Rldr = R * (((float)Vmax / V0) - 1.0);
  return pow((A / Rldr), (1.0 / B));
}

void evaluateFireRisk(float temp, float hum, int lux, unsigned long currentMillis) {
  String riskLevel = "SAFE"; // SAFE | WARNING | DANGER
  String reason = "";

  float tempDelta = (prevTemp != -999.0) ? (temp - prevTemp) : 0.0;

  // 1. Mức NGUY HIỂM CAO (Nguy cơ cháy nổ trực tiếp)
  if (temp >= TEMP_DANGER) {
    riskLevel = "DANGER";
    reason = "Nhiệt độ vượt ngưỡng nguy hiểm (" + String(temp, 1) + "°C)!";
  } else if (tempDelta >= TEMP_RATE_SPIKE) {
    riskLevel = "DANGER";
    reason = "Phát hiện nhiệt độ tăng đột ngột +" + String(tempDelta, 1) + "°C trong 2 giây!";
  } else if (temp >= TEMP_WARNING && lux >= LIGHT_FLASH) {
    riskLevel = "DANGER";
    reason = "Nhiệt độ cao kèm tia lửa/ánh sáng bất thường (" + String(lux) + " lux)!";
  }
  // 2. Mức CẢNH BÁO SỚM (Điều kiện môi trường dễ phát sinh cháy nổ)
  else if (temp >= TEMP_WARNING && hum <= HUMIDITY_LOW) {
    riskLevel = "WARNING";
    reason = "Nguy cơ cháy cao: Phòng nóng (" + String(temp, 1) + "°C) và hanh khô (" + String(hum, 1) + "%)!";
  } else if (lux >= LIGHT_FLASH) {
    riskLevel = "WARNING";
    reason = "Phát hiện lóe sáng bất thường trong phòng thực hành (" + String(lux) + " lux)!";
  }

  if (riskLevel != "SAFE") {
    digitalWrite(BUZZER_PIN, HIGH); // Kích hoạt còi cảnh báo tại chỗ

    if (currentMillis - lastAlertMillis >= alertCooldown) {
      lastAlertMillis = currentMillis;
      char alertPayload[256];
      snprintf(alertPayload, sizeof(alertPayload),
               "{\"level\": \"%s\", \"reason\": \"%s\", \"temperature\": %.2f, \"humidity\": %.2f, \"light\": %d}",
               riskLevel.c_str(), reason.c_str(), temp, hum, lux);
      mqttClient.publish("home/fire_alert", alertPayload);
      Serial.println("🚨 GỬI CẢNH BÁO: " + String(alertPayload));
    }
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }
}

void setup() {
  setup_wifi();
  mqttClient.setServer(mqtt_server, mqtt_port);
  dht.begin();

  pinMode(AO, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) setup_wifi();
  if (!mqttClient.connected()) reconnect();
  mqttClient.loop();

  unsigned long currentMillis = millis();

  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int analogRaw = analogRead(AO);
    int luxValue = (int)readLux(4095 - analogRaw);

    if (!isnan(temperature) && !isnan(humidity)) {
      evaluateFireRisk(temperature, humidity, luxValue, currentMillis);
      prevTemp = temperature;

      char payload[150];
      snprintf(payload, sizeof(payload), "{\"temperature\": %.2f, \"humidity\": %.2f, \"light\": %d}",
               temperature, humidity, luxValue);
      mqttClient.publish("home/sensor", (uint8_t*)payload, strlen(payload), true);
    }
  }
}