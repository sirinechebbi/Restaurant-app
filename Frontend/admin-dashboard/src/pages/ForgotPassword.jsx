import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 : email, 2 : code + nouveau mot de passe, 3 : terminé
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setInfo(data.message);
      setStep(2);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function reset(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Les deux mots de passe ne sont pas identiques');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), code: code.trim(), password });
      setStep(3);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h2>Mot de passe oublié</h2>
        {error && <div className="error">{error}</div>}

        {step === 1 && (
          <form className="login-card" style={{ padding: 0, boxShadow: 'none' }} onSubmit={sendCode}>
            <p className="muted">Saisis ton email : tu recevras un code de vérification.</p>
            <input type="email" placeholder="Email" value={email}
                   onChange={(e) => setEmail(e.target.value)} required />
            <button disabled={loading}>{loading ? 'Envoi...' : 'Envoyer le code'}</button>
          </form>
        )}

        {step === 2 && (
          <form className="login-card" style={{ padding: 0, boxShadow: 'none' }} onSubmit={reset}>
            {info && <div className="success">{info}</div>}
            <input placeholder="Code reçu par email (6 chiffres)" value={code}
                   onChange={(e) => setCode(e.target.value)} maxLength={6} inputMode="numeric" required />
            <input type="password" placeholder="Nouveau mot de passe (6 caractères min.)" value={password}
                   onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            <input type="password" placeholder="Confirmer le mot de passe" value={confirm}
                   onChange={(e) => setConfirm(e.target.value)} required />
            <button disabled={loading}>{loading ? 'Enregistrement...' : 'Changer le mot de passe'}</button>
            <button type="button" className="secondary" onClick={sendCode} disabled={loading}>
              Renvoyer le code
            </button>
            <p className="muted">Pense à regarder dans tes spams. Attends une minute avant de redemander un code.</p>
          </form>
        )}

        {step === 3 && (
          <>
            <div className="success">Mot de passe modifié.</div>
            <Link to="/login">Se connecter</Link>
          </>
        )}

        {step !== 3 && <Link to="/login">Retour à la connexion</Link>}
      </div>
    </div>
  );
}