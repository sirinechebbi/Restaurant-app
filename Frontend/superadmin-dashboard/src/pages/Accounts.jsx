import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';

const emptyForm = { full_name: '', email: '', phone: '', password: '', restaurant_id: '' };

export default function Accounts({ endpoint, title, withRestaurant = false, canCreate = true ,canDelete = true}) {
  const [accounts, setAccounts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const requests = [api.get(`/superadmin/${endpoint}`)];
      if (withRestaurant) requests.push(api.get('/superadmin/restaurants'));
      const [accountsRes, restaurantsRes] = await Promise.all(requests);
      setAccounts(accountsRes.data);
      if (restaurantsRes) setRestaurants(restaurantsRes.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => { load(); }, []);

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function create(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const body = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      };
      if (withRestaurant) body.restaurant_id = Number(form.restaurant_id);
      await api.post(`/superadmin/${endpoint}`, body);
      setForm(emptyForm);
      setMessage('Compte créé');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }
    async function remove(account) {
    if (!window.confirm(`Supprimer définitivement le compte de ${account.full_name} ?`)) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/superadmin/${endpoint}/${account.id}`);
      setMessage('Compte supprimé');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function toggleActive(account) {
    setError('');
    setMessage('');
    try {
      await api.put(`/superadmin/users/${account.id}/active`, { is_active: !account.is_active });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const restaurantName = (id) => restaurants.find((r) => r.id === id)?.name || '-';

  return (
    <>
      <h1>{title}</h1>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      {canCreate && (
        <form className="card" onSubmit={create}>
          <h3>Nouveau compte</h3>
          <div className="row">
            <input placeholder="Nom complet" value={form.full_name} onChange={setField('full_name')} required />
            <input type="email" placeholder="Email" value={form.email} onChange={setField('email')} required />
            <input placeholder="Téléphone" value={form.phone} onChange={setField('phone')} required />
            <input type="password" placeholder="Mot de passe (6 caractères min.)" value={form.password}
                   onChange={setField('password')} minLength={6} required />
            {withRestaurant && (
              <select value={form.restaurant_id} onChange={setField('restaurant_id')} required>
                <option value="">Restaurant</option>
                {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
            <button>Créer</button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Nom</th><th>Email</th><th>Téléphone</th>
            {withRestaurant && <th>Restaurant</th>}
            <th>Statut</th><th></th>
          </tr>
        </thead>
        <tbody>
          {accounts.length === 0 && <tr><td colSpan="6">Aucun compte.</td></tr>}
          {accounts.map((a) => (
            <tr key={a.id}>
              <td><strong>{a.full_name}</strong></td>
              <td>{a.email}</td>
              <td>{a.phone}</td>
              {withRestaurant && <td>{restaurantName(a.restaurant_id)}</td>}
              <td><span className={`badge ${a.is_active ? 'ok' : 'off'}`}>{a.is_active ? 'Actif' : 'Désactivé'}</span></td>
              <td className="row">
                <button className={a.is_active ? 'danger' : ''} onClick={() => toggleActive(a)}>
                  {a.is_active ? 'Désactiver' : 'Activer'}
                </button>
                {canDelete && (
                  <button className="danger" onClick={() => remove(a)}>Supprimer</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}