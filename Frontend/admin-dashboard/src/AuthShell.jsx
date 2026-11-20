import { useState } from 'react';

const base = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
};

export const IconMail = () => (
  <svg {...base}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
export const IconLock = () => (
  <svg {...base}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const IconKey = () => (
  <svg {...base}><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9m-3 3 3 3" /></svg>
);
export const IconEye = () => (
  <svg {...base}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconEyeOff = () => (
  <svg {...base}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A16.8 16.8 0 0 0 2 12s3.5 7 10 7c1.9 0 3.6-.5 5-1.3" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);
export const IconRestaurant = () => (
  <svg {...base}><path d="M6 3v7a2 2 0 0 0 4 0V3M8 3v18" /><path d="M17 21V3c-2 1-3.5 3.5-3.5 7 0 2 1 3 3.5 3" /></svg>
);
export const IconShield = () => (
  <svg {...base}><path d="M12 3 4 6v6c0 5 3.4 8.2 8 9 4.6-.8 8-4 8-9V6l-8-3z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconCheck = () => (
  <svg {...base} strokeWidth="2.4"><path d="m5 12 5 5 9-10" /></svg>
);

const SIDES = {
  admin: {
    Logo: IconRestaurant,
    title: 'Espace Admin',
    lead: 'Gérez votre restaurant : menu, commandes et ouverture, en temps réel.',
    points: [
      'Menu et plats à jour en quelques clics',
      'Commandes de votre restaurant en direct',
      'Ouverture et fermeture instantanées',
    ],
  },
  super: {
    Logo: IconShield,
    title: 'Espace SuperAdmin',
    lead: 'Supervisez toute la plateforme : restaurants, comptes et statistiques.',
    points: [
      'Restaurants, Admin et livreurs au même endroit',
      'Statistiques globales de la plateforme',
      'Suivi de toutes les commandes',
    ],
  },
};

export default function AuthShell({ variant = 'admin', title, subtitle, children }) {
  const side = SIDES[variant];
  const Logo = side.Logo;

  return (
    <div className={`auth-page ${variant}`}>
      <aside className="auth-side">
        <span className="auth-blob b1" />
        <span className="auth-blob b2" />
        <span className="auth-blob b3" />
        <div className="auth-side-content">
          <div className="auth-logo"><Logo /></div>
          <h1 className="auth-anim" style={{ '--i': 1 }}>{side.title}</h1>
          <p className="lead auth-anim" style={{ '--i': 2 }}>{side.lead}</p>
          <ul className="auth-points">
            {side.points.map((p, i) => (
              <li key={p} className="auth-anim" style={{ '--i': 3 + i }}>
                <span className="tick">✓</span>{p}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <h2>{title}</h2>
          {subtitle && <p className="auth-sub">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}

// Champ avec icône, et oeil pour afficher le mot de passe
export function AuthField({ icon: Icon, type = 'text', ...props }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="auth-field">
      <Icon />
      <input {...props} type={isPassword && show ? 'text' : type} />
      {isPassword && (
        <button
          type="button"
          className="auth-eye"
          tabIndex={-1}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          onClick={() => setShow((s) => !s)}
        >
          {show ? <IconEyeOff /> : <IconEye />}
        </button>
      )}
    </label>
  );
}

export const Spinner = () => <span className="auth-spinner" />;