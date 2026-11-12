import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './Layout';
import Login from './pages/Login';
import Stats from './pages/Stats';
import Restaurants from './pages/Restaurants';
import Accounts from './pages/Accounts';
import Orders from './pages/Orders';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Stats />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/admins"
               element={<Accounts key="admins" endpoint="admins" title="Comptes Admin" withRestaurant />} />
        <Route path="/drivers"
               element={<Accounts key="drivers" endpoint="drivers" title="Livreurs" />} />
                <Route path="/clients"
               element={<Accounts key="clients" endpoint="clients" title="Clients" canCreate={false} canDelete={false} />} />
        <Route path="/orders" element={<Orders />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}