import '../assets/dataSencor.scss';
import { NavLink } from 'react-router-dom';

function NavBar() {
  return (
    <nav className="navbar">
      <NavLink className="nav-item" to={'/'}>Giám sát trực tiếp</NavLink>
      <NavLink className="nav-item" to={'/history'}>Lịch sử & Cảnh báo</NavLink>
    </nav>
  );
}

export default NavBar;