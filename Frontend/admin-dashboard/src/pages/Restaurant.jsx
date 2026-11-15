import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';

export default function Restaurant() {
  const [r, setR] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/restaurant')
      .then(({ data }) => setR(data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  async function save(changes) {
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/admin/restaurant', changes);
      setR(data);
      setMessage('Modifications enregistrées');
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    save({
      description: f.get('description'),
      address: f.get('address'),
      phone: f.get('phone'),
    });
  }

  if (!r) return <p>{error || 'Chargement...'}</p>;

  return (
    <>
      <h1>{r.name}</h1>
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      <div className="card">
        <h3>Statut</h3>
        <p>
          Le restaurant est actuellement <strong>{r.is_open ? 'ouvert' : 'fermé'}</strong>.
          {!r.is_open && ' Les clients ne peuvent pas passer de commande.'}
        </p>
        <button className={r.is_open ? 'danger' : ''} onClick={() => save({ is_open: !r.is_open })}>
          {r.is_open ? 'Fermer le restaurant' : 'Ouvrir le restaurant'}
        </button>
      </div>

      <form className="card" key={r.id} onSubmit={handleSubmit}>
        <h3>Informations</h3>
        <div className="row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <input name="address" placeholder="Adresse" defaultValue={r.address || ''} />
          <input name="phone" placeholder="Téléphone" defaultValue={r.phone || ''} />
          <input name="description" placeholder="Description" defaultValue={r.description || ''} />
          <button style={{ alignSelf: 'flex-start' }}>Enregistrer</button>
        </div>
      </form>
    </>
  );
}