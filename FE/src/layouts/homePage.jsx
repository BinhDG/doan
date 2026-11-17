import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import moment from 'moment';
import ChartTmp from "../components/chartLine";
import NavBar from '../components/navbar';
import '../assets/SmartHomeDashboard.scss';

const socket = io("http://localhost:3000");

const SmartHomeDashboard = () => {
  const [temperature, setTemperature] = useState('--');
  const [humidity, setHumidity] = useState('--');
  const [light, setLight] = useState('--');
  const [timestamp, setTimestamp] = useState('');
  const [activeAlert, setActiveAlert] = useState(null);

  const StatCard = ({ icon, label, value, unit, color, className }) => (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-header">
        <span className="stat-icon" style={{ color }}>{icon}</span>
      </div>
      <div className="stat-content">
        <h3 className={className}>{value}<span>{unit}</span></h3>
        <p>{label}</p>
      </div>
    </div>
  );

  const getStatusClass = (type, value) => {
    if (value === '--') return '';
    if (type === "temperature") {
      if (value < 25) return "level-2";
      if (value < 38) return "level-3";
      if (value < 48) return "level-4";
      return "level-5";
    }
    if (type === "humidity") {
      if (value < 25) return "level-5";
      if (value < 40) return "level-4";
      return "level-3";
    }
    if (type === "light") {
      if (value > 3200) return "level-5";
      if (value > 2000) return "level-4";
      return "level-3";
    }
    return "";
  };

  useEffect(() => {
    socket.on("dataSensor", (data) => {
      setHumidity(data.humidity);
      setTemperature(data.temperature);
      setLight(data.light);
      setTimestamp(new Date().toISOString());
    });

    socket.on("fireAlert", (alertData) => {
      setActiveAlert({
        ...alertData,
        timeFormatted: moment(alertData.createdAt).format("HH:mm:ss DD/MM/YYYY")
      });
    });

    return () => {
      socket.off("dataSensor");
      socket.off("fireAlert");
    };
  }, []);

  return (
    <div className="smart-home-dashboard">
      <NavBar />

      {/* BANNER CẢNH BÁO CHÁY NỔ KHẨN CẤP */}
      {activeAlert && (
        <div style={{
          backgroundColor: activeAlert.level === 'DANGER' ? '#dc2626' : '#f59e0b',
          color: '#fff',
          padding: '16px 24px',
          margin: '16px auto',
          maxWidth: '1200px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 20px rgba(220, 38, 38, 0.35)'
        }}>
          <div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.25rem' }}>
              {activeAlert.level === 'DANGER' ? '🚨 BÁO ĐỘNG CHÁY NỔ KHẨN CẤP!' : '⚠️ CẢNH BÁO NGUY CƠ AN TOÀN!'}
            </h2>
            <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>
              <strong>Nguyên nhân:</strong> {activeAlert.reason}
            </p>
            <small style={{ opacity: 0.95 }}>
              Thời gian: {activeAlert.timeFormatted} | Nhiệt độ: {activeAlert.temperature}°C | Độ ẩm: {activeAlert.humidity}% | Ánh sáng: {activeAlert.light} lux
            </small>
          </div>
          <button
            onClick={() => setActiveAlert(null)}
            style={{
              backgroundColor: '#fff',
              color: activeAlert.level === 'DANGER' ? '#dc2626' : '#d97706',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Đã tiếp nhận & Tắt thông báo
          </button>
        </div>
      )}

      <div className="main-content" style={{ gridTemplateColumns: '1fr', maxWidth: '1200px', margin: '0 auto' }}>
        <div>
          <div style={{
            background: activeAlert ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${activeAlert ? '#ef4444' : '#10b981'}`,
            color: activeAlert ? '#991b1b' : '#065f46',
            padding: '12px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontWeight: '600',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>
              Trạng thái phòng thực hành: {activeAlert ? 'ĐANG CÓ CẢNH BÁO NGUY HIỂM' : 'AN TOÀN - BÌNH THƯỜNG'}
            </span>
            <span>Cập nhật: {timestamp ? moment(timestamp).format('HH:mm:ss') : 'Đang chờ dữ liệu...'}</span>
          </div>

          <div className="stats-grid">
            <StatCard 
              icon="🌡️" label="Nhiệt độ" value={temperature} unit="°C" color="#FF6B6B"
              className={getStatusClass("temperature", temperature)}
            />
            <StatCard 
              icon="💧" label="Độ ẩm" value={humidity} unit="%" color="#45B7D1"
              className={getStatusClass("humidity", humidity)}
            />
            <StatCard 
              icon="☀️" label="Ánh sáng" value={light} unit="lux" color="#F59E0B"
              className={getStatusClass("light", light)}
            />
          </div>

          <div className="content-grid">
            <div className="chart-section">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Biểu đồ môi trường phòng thực hành</h3>
                  <span className="chart-period">Thời gian thực (2s/lần)</span>
                </div>
                <div className="chart-container" style={{ height: '380px' }}>
                  <ChartTmp 
                    humiditi={humidity}
                    temp={temperature}
                    lights={light}
                    timestamp={timestamp}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartHomeDashboard;