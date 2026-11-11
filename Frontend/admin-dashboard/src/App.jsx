import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Layout from './Layout';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Restaurant from './pages/Restaurant';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Orders />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/restaurant" element={<Restaurant />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}