import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>SuperAdmin</h2>
        <nav>
          <NavLink to="/" end>Statistiques</NavLink>
          <NavLink to="/restaurants">Restaurants</NavLink>
          <NavLink to="/admins">Comptes Admin</NavLink>
          <NavLink to="/drivers">Livreurs</NavLink>
          <NavLink to="/clients">Clients</NavLink>
          <NavLink to="/orders">Commandes</NavLink>
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