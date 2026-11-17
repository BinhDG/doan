import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../assets/dataSencor.scss';
import NavBar from '../components/navbar';
import Pagination from '../components/pagination';

const HistoryPage = () => {
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'sensors'

  const [searchTerm, setSearchTerm] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');

  const [alertLevel, setAlertLevel] = useState('');
  const [sensorFilter, setSensorFilter] = useState('all');
  const [tableData, setTableData] = useState([]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
    setSearchItem('');
    setSortField('id');
    setSortDirection('desc');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sortVal = sortDirection === 'asc' ? 1 : -1;
        if (activeTab === 'alerts') {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/getFireAlerts?page=${currentPage}&frequent=${itemsPerPage}&level=${alertLevel}&keyword=${searchItem}&sortKey=${sortField}&sortValue=${sortVal}`
          );
          setTableData(res.data?.doc || []);
          setTotalPage(res.data?.totalPage || 1);
        } else {
          const res = await axios.get(
            `${import.meta.env.VITE_API_URL}/getDataSensor?filter=${sensorFilter}&keyword=${searchItem}&page=${currentPage}&frequent=${itemsPerPage}&sortKey=${sortField}&sortValue=${sortVal}`
          );
          setTableData(res.data?.doc || []);
          setTotalPage(res.data?.totalPage || 1);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        setTableData([]);
      }
    };
    fetchData();
  }, [activeTab, currentPage, itemsPerPage, sortDirection, sortField, searchItem, alertLevel, sensorFilter]);

  const handleSort = (field) => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleSearch = () => {
    setSearchItem(searchTerm);
    setCurrentPage(1);
  };

  const deleteSearch = () => {
    setSearchTerm('');
    setSearchItem('');
    setCurrentPage(1);
  };

  return (
    <div className="data-sensor-page">
      <NavBar />
      <div className="content">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h1>{activeTab === 'alerts' ? '🚨 Lịch sử cảnh báo cháy nổ' : '📊 Lịch sử thông số cảm biến'}</h1>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleTabChange('alerts')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: activeTab === 'alerts' ? '#dc2626' : '#e5e7eb',
                color: activeTab === 'alerts' ? '#fff' : '#374151'
              }}
            >
              Lịch sử cháy nổ
            </button>
            <button
              onClick={() => handleTabChange('sensors')}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                backgroundColor: activeTab === 'sensors' ? '#2563eb' : '#e5e7eb',
                color: activeTab === 'sensors' ? '#fff' : '#374151'
              }}
            >
              Lịch sử cảm biến
            </button>
          </div>
        </div>

        <div className="wrapper-bar">
          <div className="filter-bar">
            {activeTab === 'alerts' ? (
              <select value={alertLevel} onChange={(e) => { setAlertLevel(e.target.value); setCurrentPage(1); }}>
                <option value="">Tất cả mức độ</option>
                <option value="DANGER">Nguy hiểm (Cháy nổ)</option>
                <option value="WARNING">Cảnh báo sớm</option>
              </select>
            ) : (
              <select value={sensorFilter} onChange={(e) => { setSensorFilter(e.target.value); setCurrentPage(1); }}>
                <option value="all">Tất cả thông số</option>
                <option value="temperature">Nhiệt độ</option>
                <option value="humidity">Độ ẩm</option>
                <option value="light">Ánh sáng</option>
                <option value="createdAt">Thời gian</option>
              </select>
            )}
          </div>

          <div className="search-section">
            <div className="search-container">
              <input
                type="text"
                placeholder={activeTab === 'alerts' ? "Tìm nguyên nhân hoặc HH:mm:ss DD/MM/YYYY..." : "Tìm giá trị hoặc thời gian..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button className='deleteButton' onClick={deleteSearch}>X</button>
            </div>
            <button className="search-btn" onClick={handleSearch}>🔍 Tìm kiếm</button>
          </div>
        </div>

        <div className="table-container">
          {activeTab === 'alerts' ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>ID {getSortIcon('id')}</th>
                  <th>Mức độ</th>
                  <th>Nguyên nhân dự đoán</th>
                  <th>Nhiệt độ (°C)</th>
                  <th>Độ ẩm (%)</th>
                  <th>Ánh sáng (lux)</th>
                  <th onClick={() => handleSort('createdAt')}>Thời gian {getSortIcon('createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {tableData.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Chưa ghi nhận cảnh báo cháy nổ nào.</td></tr>
                ) : (
                  tableData.map((item, index) => (
                    <tr key={item.id || index} style={{ backgroundColor: item.level === 'DANGER' ? '#fef2f2' : '#fffbeb' }}>
                      <td>{item.id}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          backgroundColor: item.level === 'DANGER' ? '#dc2626' : '#f59e0b',
                          color: '#fff'
                        }}>
                          {item.level === 'DANGER' ? 'NGUY HIỂM' : 'CẢNH BÁO'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500', textAlign: 'left' }}>{item.reason}</td>
                      <td>{item.temperature}</td>
                      <td>{item.humidity}</td>
                      <td>{item.light}</td>
                      <td>{item.createdAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('id')}>ID {getSortIcon('id')}</th>
                  <th onClick={() => handleSort('temperature')}>Nhiệt độ (°C) {getSortIcon('temperature')}</th>
                  <th onClick={() => handleSort('humidity')}>Độ ẩm (%) {getSortIcon('humidity')}</th>
                  <th onClick={() => handleSort('light')}>Ánh sáng (lux) {getSortIcon('light')}</th>
                  <th onClick={() => handleSort('createdAt')}>Thời gian {getSortIcon('createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => (
                  <tr key={item.id || index}>
                    <td>{item.id}</td>
                    <td>{item.temperature}</td>
                    <td>{item.humidity}</td>
                    <td>{item.light}</td>
                    <td>{item.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="wrapper-pagi">
          <Pagination
            handlePageChange={(page) => setCurrentPage(page)}
            currentPage={currentPage}
            totalPages={totalPage}
          />
          <div className="items-per-page">
            <label>Hiển thị: </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span> bản ghi / trang</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;