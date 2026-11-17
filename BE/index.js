const express = require('express');
const mqtt = require('mqtt');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
const httpServer = createServer(app);
const route = require('./route');
const sequelize = require('./db');

const DataSensor = require("./model/dataSensor");
const FireAlert = require("./model/FireAlert");

const io = new Server(httpServer, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

const mqttClient = mqtt.connect("mqtt://127.0.0.1:1884", {
    username: 'tripled',
    password: '842004'  
});

sequelize.authenticate()
    .then(() => {
        console.log('Connected to MySQL');
        return sequelize.sync(); // Tự động tạo bảng data_sensors và fire_alerts
    })
    .catch(err => console.log('Database Error:', err));

mqttClient.on('connect', () => {
    mqttClient.subscribe(['home/sensor', 'home/fire_alert', 'home/status']);
    console.log('Đã đăng ký các topic MQTT: home/sensor, home/fire_alert');
});

mqttClient.on('message', async (topic, message) => {
    const msgString = message.toString();

    if (topic === "home/sensor") {
        try {
            const tmpData = JSON.parse(msgString);
            await DataSensor.create({
                temperature: tmpData.temperature,
                humidity: tmpData.humidity,
                light: tmpData.light
            });
            io.emit('dataSensor', tmpData);     
        } catch (error) {
            console.error("Lỗi lưu dữ liệu cảm biến:", error);
        }
    }
    
    if (topic === "home/fire_alert") {
        try {
            const alertData = JSON.parse(msgString);
            const savedAlert = await FireAlert.create({
                level: alertData.level,
                reason: alertData.reason,
                temperature: alertData.temperature,
                humidity: alertData.humidity,
                light: alertData.light
            });
            
            // Đẩy cảnh báo cháy nổ realtime tới Frontend
            io.emit('fireAlert', {
                id: savedAlert.id,
                level: savedAlert.level,
                reason: savedAlert.reason,
                temperature: savedAlert.temperature,
                humidity: savedAlert.humidity,
                light: savedAlert.light,
                createdAt: savedAlert.createdAt
            });
            console.log("🚨 Đã nhận và phát cảnh báo cháy nổ:", alertData.reason);
        } catch (error) {
            console.error("Lỗi xử lý cảnh báo cháy nổ:", error);
        }
    }
});

route(app);
httpServer.listen(3000, () => console.log('Backend running on port 3000'));