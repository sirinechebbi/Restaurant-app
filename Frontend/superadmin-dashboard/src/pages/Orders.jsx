import { Fragment, useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api';

const STATUS = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  ON_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};
const PAYMENT = { ONLINE: 'En ligne', CASH: 'À la livraison' };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [status, setStatus] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/superadmin/restaurants').then(({ data }) => setRestaurants(data)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (status) params.status = status;
      if (restaurantId) params.restaurant_id = restaurantId;
      const { data } = await api.get('/superadmin/orders', { params });
      setOrders(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [status, restaurantId]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Commandes</h1>
        <div className="row">
          <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} style={{ flex: 'none' }}>
            <option value="">Tous les restaurants</option>
            {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ flex: 'none' }}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>N°</th><th>Date</th><th>Restaurant</th><th>Client</th><th>Total</th>
            <th>Paiement</th><th>Statut</th><th>Livreur</th><th></th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && <tr><td colSpan="9">Aucune commande.</td></tr>}
          {orders.map((o) => (
            <Fragment key={o.id}>
              <tr>
                <td>#{o.id}</td>
                <td>{new Date(o.created_at).toLocaleString('fr-FR')}</td>
                <td>{o.restaurant?.name}</td>
                <td>{o.client?.full_name}</td>
                <td>{Number(o.total).toFixed(2)} DT</td>
                <td>{PAYMENT[o.payment_method]}{o.payment_status === 'PAID' ? ' (payé)' : ''}</td>
                <td><span className={`badge ${o.status}`}>{STATUS[o.status]}</span></td>
                <td>{o.driver?.full_name || '-'}</td>
                <td>
                  <button className="secondary" onClick={() => setOpenId(openId === o.id ? null : o.id)}>
                    {openId === o.id ? 'Masquer' : 'Détails'}
                  </button>
                </td>
              </tr>
              {openId === o.id && (
                <tr>
                  <td colSpan="9" className="details">
                    <strong>Plats :</strong>
                    <ul>
                      {o.items.map((i) => (
                        <li key={i.menu_item_id}>{i.quantity} × {i.name} ({Number(i.unit_price).toFixed(2)} DT)</li>
                      ))}
                    </ul>
                    <p><strong>Téléphone du client :</strong> {o.phone}</p>
                    {o.address_details && <p><strong>Adresse :</strong> {o.address_details}</p>}
                    <p>
                      <a href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`} target="_blank" rel="noreferrer">
                        Voir la position sur la carte
                      </a>
                    </p>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  );
}