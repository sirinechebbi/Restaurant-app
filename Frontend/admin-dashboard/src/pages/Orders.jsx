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
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/orders', { params: status ? { status } : {} });
      setOrders(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [status]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  async function cancel(id) {
    if (!window.confirm('Annuler cette commande ?')) return;
    try {
      await api.put(`/admin/orders/${id}/cancel`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Commandes</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ flex: 'none' }}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>N°</th><th>Date</th><th>Client</th><th>Total</th>
            <th>Paiement</th><th>Statut</th><th>Livreur</th><th></th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr><td colSpan="8">Aucune commande.</td></tr>
          )}
          {orders.map((o) => (
            <Fragment key={o.id}>
              <tr>
                <td>#{o.id}</td>
                <td>{new Date(o.created_at).toLocaleString('fr-FR')}</td>
                <td>{o.client?.full_name}</td>
                <td>{Number(o.total).toFixed(2)} DT</td>
                <td>
                  {PAYMENT[o.payment_method]}
                  {o.payment_status === 'PAID' ? ' (payé)' : ''}
                </td>
                <td><span className={`badge ${o.status}`}>{STATUS[o.status]}</span></td>
                <td>{o.driver?.full_name || '-'}</td>
                <td className="row">
                  <button className="secondary" onClick={() => setOpenId(openId === o.id ? null : o.id)}>
                    {openId === o.id ? 'Masquer' : 'Détails'}
                  </button>
                  {['PENDING', 'ACCEPTED'].includes(o.status) && (
                    <button className="danger" onClick={() => cancel(o.id)}>Annuler</button>
                  )}
                </td>
              </tr>
              {openId === o.id && (
                <tr>
                  <td colSpan="8" className="details">
                    <strong>Plats :</strong>
                    <ul>
                      {o.items.map((i) => (
                        <li key={i.menu_item_id}>
                          {i.quantity} × {i.name} ({Number(i.unit_price).toFixed(2)} DT)
                        </li>
                      ))}
                    </ul>
                    <p><strong>Téléphone du client :</strong> {o.phone}</p>
                    {o.address_details && <p><strong>Adresse :</strong> {o.address_details}</p>}
                    <p>
                      <a href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                         target="_blank" rel="noreferrer">
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