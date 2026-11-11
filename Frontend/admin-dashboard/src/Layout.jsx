import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Espace Admin</h2>
        <nav>
          <NavLink to="/" end>Commandes</NavLink>
          <NavLink to="/menu">Menu</NavLink>
          <NavLink to="/restaurant">Mon restaurant</NavLink>
        </nav>
        <div className="sidebar-footer">
          <small>{user.full_name}</small>
          <button className="secondary" onClick={() => { logout(); navigate('/login'); }}>
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}