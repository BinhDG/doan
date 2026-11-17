import React, { useEffect, useState } from 'react';
import axios from 'axios';
// Import thêm Brush từ recharts 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';
import NavBar from '../components/navbar';
import moment from 'moment';
import '../assets/SmartHomeDashboard.scss';

const ActivityPage = () => {
    const [data, setData] = useState([]);

    // Màu sắc cố định cho từng đèn [cite: 5]
    const deviceColors = {
        led1: '#4ECDC4',
        led2: '#FF6B6B',
        led3: '#FFE66D',
        led4: '#45B7D1',
        led5: '#F97316',
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/getActivityStats`);
                
                // Nhóm dữ liệu theo ngày [cite: 5]
                const groupedData = res.data.reduce((acc, curr) => {
                    const dateLabel = moment(curr.date).format('DD/MM/YYYY');
                    if (!acc[dateLabel]) {
                        acc[dateLabel] = { date: dateLabel };
                    }
                    acc[dateLabel][curr.device] = parseInt(curr.total);
                    return acc;
                }, {});

                setData(Object.values(groupedData));
            } catch (err) {
                console.log("Lỗi tải thống kê", err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="smart-home-dashboard">
            <NavBar />
            <div className="main-content" style={{ display: 'block' }}>
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <h1>Thống kê hoạt động toàn thời gian</h1>
                    
                </div>

                <div className="chart-card" style={{ background: 'white', padding: '2rem', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ height: '500px', width: '100%' }}>
                        <ResponsiveContainer>
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis allowDecimals={false} label={{ value: 'Lượt thao tác', angle: -90, position: 'insideLeft' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                
                                <Bar dataKey="led1" name="Đèn 1" fill={deviceColors.led1} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="led2" name="Đèn 2" fill={deviceColors.led2} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="led3" name="Đèn 3" fill={deviceColors.led3} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="led4" name="Đèn 4" fill={deviceColors.led4} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="led5" name="Đèn 5" fill={deviceColors.led5} radius={[4, 4, 0, 0]} />

                                {/* THANH TRƯỢT (BRUSH)  */}
                                {/* startIndex xác định số lượng cột hiển thị mặc định (ví dụ hiển thị 10 ngày gần nhất) */}
                                <Brush 
                                    dataKey="date" 
                                    height={30} 
                                    stroke="#8884d8" 
                                    startIndex={data.length > 10 ? data.length - 10 : 0}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityPage;