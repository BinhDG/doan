import { Routes, Route } from 'react-router-dom';
import SmartHomeDashboard from './layouts/homePage';
import HistoryPage from './layouts/history';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SmartHomeDashboard />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  );
}

export default App;