import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api';

const emptyForm = { name: '', description: '', price: '', category_id: '', image_url: '' };

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [catName, setCatName] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    try {
      const [c, i] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/menu-items'),
      ]);
      setCategories(c.data);
      setItems(i.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => { load(); }, []);

  // Exécute une action, puis recharge la liste
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

  function addCategory(e) {
    e.preventDefault();
    run(async () => {
      await api.post('/admin/categories', { name: catName });
      setCatName('');
    });
  }

  function deleteCategory(id) {
    if (window.confirm('Supprimer cette catégorie ?')) {
      run(() => api.delete(`/admin/categories/${id}`));
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      category_id: item.category_id,
      image_url: item.image_url || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function saveItem(e) {
    e.preventDefault();
    const body = {
      ...form,
      price: Number(form.price),
      description: form.description || null,
      image_url: form.image_url || null,
    };
    run(async () => {
      if (editingId) await api.put(`/admin/menu-items/${editingId}`, body);
      else await api.post('/admin/menu-items', body);
      resetForm();
    });
  }

  function toggleAvailable(item) {
    run(() => api.put(`/admin/menu-items/${item.id}`, { is_available: !item.is_available }));
  }

  function deleteItem(id) {
    if (window.confirm('Supprimer ce plat ?')) {
      run(() => api.delete(`/admin/menu-items/${id}`));
    }
  }

  const categoryName = (id) => categories.find((c) => c.id === id)?.name || '-';

  return (
    <>
      <h1>Menu</h1>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h3>Catégories</h3>
        <form className="row" onSubmit={addCategory}>
          <input value={catName} onChange={(e) => setCatName(e.target.value)}
                 placeholder="Nouvelle catégorie (ex : Desserts)" required />
          <button>Ajouter</button>
        </form>
        <div className="chips">
          {categories.map((c) => (
            <span className="chip" key={c.id}>
              {c.name}
              <button type="button" className="chip-x" title="Supprimer"
                      onClick={() => deleteCategory(c.id)}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>{editingId ? 'Modifier le plat' : 'Ajouter un plat'}</h3>
        <form className="row" onSubmit={saveItem}>
          <input placeholder="Nom" value={form.name} onChange={setField('name')} required />
          <input placeholder="Prix (DT)" type="number" step="0.01" min="0"
                 value={form.price} onChange={setField('price')} required />
          <select value={form.category_id} onChange={setField('category_id')} required>
            <option value="">Catégorie</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Description" value={form.description} onChange={setField('description')} />
          <input placeholder="URL de l'image (facultatif)" value={form.image_url}
                 onChange={setField('image_url')} />
          <button>{editingId ? 'Enregistrer' : 'Ajouter'}</button>
          {editingId && (
            <button type="button" className="secondary" onClick={resetForm}>Annuler</button>
          )}
        </form>
      </div>

      <table>
        <thead>
          <tr><th>Plat</th><th>Catégorie</th><th>Prix</th><th>Disponible</th><th></th></tr>
        </thead>
        <tbody>
          {items.length === 0 && <tr><td colSpan="5">Aucun plat.</td></tr>}
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <strong>{item.name}</strong>
                {item.description && <div className="muted">{item.description}</div>}
              </td>
              <td>{categoryName(item.category_id)}</td>
              <td>{Number(item.price).toFixed(2)} DT</td>
              <td>
                <button className={item.is_available ? '' : 'secondary'} onClick={() => toggleAvailable(item)}>
                  {item.is_available ? 'Oui' : 'Non'}
                </button>
              </td>
              <td className="row">
                <button className="secondary" onClick={() => startEdit(item)}>Modifier</button>
                <button className="danger" onClick={() => deleteItem(item.id)}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}