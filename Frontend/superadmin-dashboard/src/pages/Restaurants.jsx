import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';

const emptyForm = { name: '', address: '', phone: '', description: '', latitude: '', longitude: '' };

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/superadmin/restaurants');
      setRestaurants(data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => { load(); }, []);

  async function run(action) {
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  const setField = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(r) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      address: r.address || '',
      phone: r.phone || '',
      description: r.description || '',
      latitude: r.latitude ?? '',
      longitude: r.longitude ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save(e) {
    e.preventDefault();
    const body = {
      name: form.name.trim(),
      address: form.address || null,
      phone: form.phone || null,
      description: form.description || null,
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
    };
    run(async () => {
      if (editingId) await api.put(`/superadmin/restaurants/${editingId}`, body);
      else await api.post('/superadmin/restaurants', body);
      resetForm();
    });
  }
    function remove(r) {
    if (window.confirm(`Supprimer définitivement « ${r.name} », son menu et ses comptes Admin ?`)) {
      run(() => api.delete(`/superadmin/restaurants/${r.id}`));
    }
  }
  function toggle(r, field) {
    run(() => api.put(`/superadmin/restaurants/${r.id}`, { [field]: !r[field] }));
  }

  return (
    <>
      <h1>Restaurants</h1>
      {error && <div className="error">{error}</div>}

      <form className="card" onSubmit={save}>
        <h3>{editingId ? 'Modifier le restaurant' : 'Ajouter un restaurant'}</h3>
        <div className="row">
          <input placeholder="Nom" value={form.name} onChange={setField('name')} required />
          <input placeholder="Adresse" value={form.address} onChange={setField('address')} />
          <input placeholder="Téléphone" value={form.phone} onChange={setField('phone')} />
          <input placeholder="Description" value={form.description} onChange={setField('description')} />
          <input placeholder="Latitude" type="number" step="any" value={form.latitude} onChange={setField('latitude')} />
          <input placeholder="Longitude" type="number" step="any" value={form.longitude} onChange={setField('longitude')} />
          <button>{editingId ? 'Enregistrer' : 'Ajouter'}</button>
          {editingId && <button type="button" className="secondary" onClick={resetForm}>Annuler</button>}
        </div>
      </form>

      <table>
        <thead>
          <tr><th>Restaurant</th><th>Adresse</th><th>Téléphone</th><th>Ouverture</th><th>Statut</th><th></th></tr>
        </thead>
        <tbody>
          {restaurants.map((r) => (
            <tr key={r.id}>
              <td><strong>{r.name}</strong></td>
              <td>{r.address || '-'}</td>
              <td>{r.phone || '-'}</td>
              <td><span className={`badge ${r.is_open ? 'ok' : 'off'}`}>{r.is_open ? 'Ouvert' : 'Fermé'}</span></td>
              <td><span className={`badge ${r.is_active ? 'ok' : 'off'}`}>{r.is_active ? 'Actif' : 'Suspendu'}</span></td>
              <td className="row">
                <button className="secondary" onClick={() => startEdit(r)}>Modifier</button>
                <button className="secondary" onClick={() => toggle(r, 'is_open')}>
                  {r.is_open ? 'Fermer' : 'Ouvrir'}
                </button>
                <button className="danger" onClick={() => remove(r)}>Supprimer</button>
                <button className={r.is_active ? 'danger' : ''} onClick={() => toggle(r, 'is_active')}>
                  {r.is_active ? 'Suspendre' : 'Réactiver'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}