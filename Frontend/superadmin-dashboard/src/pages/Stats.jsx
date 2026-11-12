import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';

const STATUS = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptées',
  ON_DELIVERY: 'En livraison',
  DELIVERED: 'Livrées',
  CANCELLED: 'Annulées',
};

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/superadmin/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (!stats) return <p>{error || 'Chargement...'}</p>;

  const restaurants = [...stats.restaurants].sort((a, b) => b.revenue - a.revenue);
  const drivers = [...stats.drivers].sort((a, b) => b.deliveries - a.deliveries);

  return (
    <>
      <h1>Statistiques</h1>

      <div className="cards">
        <div className="stat"><div className="value">{stats.total_orders}</div><div className="label">Commandes</div></div>
        <div className="stat"><div className="value">{stats.revenue.toFixed(2)} DT</div><div className="label">Chiffre d'affaires (livrées)</div></div>
        <div className="stat"><div className="value">{stats.clients}</div><div className="label">Clients</div></div>
        <div className="stat"><div className="value">{stats.restaurants.length}</div><div className="label">Restaurants</div></div>
      </div>

      <div className="card">
        <h3>Commandes par statut</h3>
        <div className="chips">
          {Object.entries(STATUS).map(([key, label]) => (
            <span className="chip" key={key}>{label} : <strong>{stats.by_status[key] || 0}</strong></span>
          ))}
        </div>
      </div>

      <h3>Restaurants</h3>
      <table>
        <thead><tr><th>Restaurant</th><th>Commandes livrées</th><th>Chiffre d'affaires</th></tr></thead>
        <tbody>
          {restaurants.map((r) => (
            <tr key={r.id}><td>{r.name}</td><td>{r.delivered_orders}</td><td>{r.revenue.toFixed(2)} DT</td></tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 24 }}>Livreurs</h3>
      <table>
        <thead><tr><th>Livreur</th><th>Livraisons effectuées</th></tr></thead>
        <tbody>
          {drivers.length === 0 && <tr><td colSpan="2">Aucun livreur.</td></tr>}
          {drivers.map((d) => (
            <tr key={d.id}><td>{d.name}</td><td>{d.deliveries}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}