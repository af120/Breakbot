import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Link } from 'react-router-dom';
import { Menu, X, MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';

// --- Contexts ---
type Language = 'en' | 'ckb' | 'ar';

interface I18nContextType {
  lang: Language;
  setLang: (l: Language) => void;
  dir: 'ltr' | 'rtl';
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

const translations = {
  en: {
    'nav.home': 'Home',
    'nav.book': 'Book Now',
    'nav.gallery': 'Gallery',
    'nav.admin': 'Admin',
    'hero.title': 'Premium Car Care',
    'hero.subtitle': 'Professional washing, detailing, and protection services in Iraq.',
    'hero.cta': 'Book Appointment',
    'hero.location': 'Get Directions',
  },
  ckb: {
    'nav.home': 'سەرەکی',
    'nav.book': 'حجز بکە',
    'nav.gallery': 'گالەری',
    'nav.admin': 'ئەدمین',
    'hero.title': 'خزمەتگوزاری نایابی ئۆتۆمبێل',
    'hero.subtitle': 'شۆردن، پاککردنەوە، و خزمەتگوزاری پاراستنی پرۆفیشناڵ لە عێراق.',
    'hero.cta': 'حجزکردنی کات',
    'hero.location': 'وەرگرتنی ناونیشان',
  },
  ar: {
    'nav.home': 'الرئيسية',
    'nav.book': 'احجز الآن',
    'nav.gallery': 'المعرض',
    'nav.admin': 'المدير',
    'hero.title': 'عناية ممتازة بالسيارات',
    'hero.subtitle': 'خدمات غسيل وتنظيف وحماية احترافية في العراق.',
    'hero.cta': 'احجز موعداً',
    'hero.location': 'احصل على الاتجاهات',
  }
};

export const I18nProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const t = (key: string) => {
    return translations[lang][key as keyof typeof translations['en']] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, dir, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
};

// --- Layouts ---
const PublicLayout = () => {
  const { lang, setLang, t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <header className="site-header">
        <div className="container flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2" style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
            <span style={{ color: 'var(--color-aqua)' }}>💧</span> CarWash
          </Link>
          
          <nav className="header-nav flex items-center gap-6" style={{ display: 'none' }}>
             {/* Desktop nav is hidden on mobile via CSS, but let's do an inline check for simplicity in this MVP */}
          </nav>

          <div className="flex items-center gap-4">
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value as Language)}
              style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '4px', padding: '4px' }}
            >
              <option value="en" style={{color: 'black'}}>English</option>
              <option value="ckb" style={{color: 'black'}}>کوردی</option>
              <option value="ar" style={{color: 'black'}}>العربية</option>
            </select>
            
            <button className="btn btn-ghost" style={{ color: 'white', padding: '0.5rem' }} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ backgroundColor: 'var(--color-primary)', padding: '1rem', color: 'white' }}>
          <div className="container flex flex-col gap-4">
             <Link to="/" onClick={() => setMenuOpen(false)}>{t('nav.home')}</Link>
             <Link to="/book" onClick={() => setMenuOpen(false)}>{t('nav.book')}</Link>
             <Link to="/admin" onClick={() => setMenuOpen(false)}>{t('nav.admin')}</Link>
          </div>
        </div>
      )}

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--text-inverse)', padding: '2rem 0' }}>
        <div className="container text-center">
          <p>© 2026 Car Wash Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const AdminLayout = () => {
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) setAuth(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!auth) return <AdminLogin onLogin={() => setAuth(true)} />;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuth(false);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-surface-elevated)' }}>
      <header className="site-header" style={{ backgroundColor: 'white', color: 'var(--text-main)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container flex justify-between items-center">
          <span style={{ fontWeight: 'bold' }}>Admin Dashboard</span>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem' }}>Logout</button>
            <Link to="/" className="btn btn-outline" style={{ padding: '0.25rem 0.75rem' }}>View Site</Link>
          </div>
        </div>
      </header>
      <main className="container p-4" style={{ flex: 1 }}>
        <Outlet />
      </main>
      {/* Bottom Nav for Mobile Admin */}
      <nav style={{ position: 'sticky', bottom: 0, backgroundColor: 'white', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-around', padding: '0.75rem' }}>
        <Link to="/admin" className="flex flex-col items-center gap-1" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>
          <Calendar size={20} />
          <span>Queue</span>
        </Link>
        <Link to="/admin/bays" className="flex flex-col items-center gap-1" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.75rem' }}>
          <Clock size={20} />
          <span>Bays</span>
        </Link>
      </nav>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) onLogin();
    else setError('Invalid credentials');
  };

  return (
    <div className="container mt-8" style={{ maxWidth: '400px' }}>
      <div className="card card-body">
        <h2>Admin Login</h2>
        {error && <div style={{ color: 'var(--color-error)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="form-control" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="form-control" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full mt-4">Login</button>
        </form>
      </div>
    </div>
  );
};

// --- Pages ---
const Home = () => {
  const { t } = useI18n();
  return (
    <div>
      {/* Hero Section */}
      <section style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '4rem 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '1rem' }}>{t('hero.title')}</h1>
          <p style={{ fontSize: '1.125rem', opacity: 0.9, marginBottom: '2rem', maxWidth: '600px', marginInline: 'auto' }}>
            {t('hero.subtitle')}
          </p>
          <div className="flex gap-4 justify-center" style={{ flexWrap: 'wrap' }}>
            <Link to="/book" className="btn btn-primary">{t('hero.cta')}</Link>
            <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>
              <MapPin size={20} /> {t('hero.location')}
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="container py-8 mt-8">
        <h2 className="text-center mb-8">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Exterior Wash', price: '15,000 IQD', desc: 'Hand wash, wheel cleaning, tire shine.' },
            { title: 'Full Detail', price: '45,000 IQD', desc: 'Interior vacuum, exterior wash, wax, windows.' },
            { title: 'Engine Clean', price: '20,000 IQD', desc: 'Safe engine bay degreasing and dressing.' }
          ].map((s, i) => (
            <div key={i} className="card card-body">
              <h3 style={{ color: 'var(--color-accent)' }}>{s.title}</h3>
              <p className="text-muted mb-4">{s.desc}</p>
              <div className="flex justify-between items-center mt-auto">
                <strong style={{ fontSize: '1.25rem' }}>{s.price}</strong>
                <Link to="/book" className="btn btn-ghost" style={{ padding: '0.5rem' }}><ChevronRight /></Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const Book = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ vehicle_type: 'Sedan', service_id: 's-ext', date: '', time: '', phone: '', name: '' });
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setReference(data.reference);
        setStep(3);
      } else {
        setError(data.error || 'Failed to book');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="container mt-8 mb-8" style={{ maxWidth: '600px' }}>
      <div className="card card-body">
        <h2 style={{ textAlign: 'center' }}>Book Appointment</h2>
        
        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Vehicle Type</label>
              <select className="form-control" value={formData.vehicle_type} onChange={e => setFormData({...formData, vehicle_type: e.target.value})}>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Service</label>
              <select className="form-control" value={formData.service_id} onChange={e => setFormData({...formData, service_id: e.target.value})}>
                <option value="s-ext">Exterior Wash (15,000 IQD)</option>
                <option value="s-full">Full Detail (45,000 IQD)</option>
              </select>
            </div>
            <button className="btn btn-primary btn-full mt-4" onClick={() => setStep(2)}>Next</button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Name (Optional)</label>
              <input type="text" className="form-control" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" required value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input type="time" className="form-control" required value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number (WhatsApp)</label>
              <input type="tel" className="form-control" placeholder="0750 XXX XXXX" required dir="ltr" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {loading ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-8">
            <div style={{ display: 'inline-flex', background: 'var(--color-success)', color: 'white', borderRadius: '50%', padding: '1rem', marginBottom: '1rem' }}>
              ✓
            </div>
            <h3>Booking Confirmed!</h3>
            <p style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--color-accent)', margin: '1rem 0' }}>Ref: {reference}</p>
            <p className="text-muted">We will see you soon. You can pay at the car wash.</p>
            <Link to="/" className="btn btn-primary mt-4">Return Home</Link>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => setQueue(d.queue || []));
  }, []);

  return (
    <div>
      <h2 className="mb-4">Queue & Walk-ins</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {queue.length === 0 ? (
          <p className="text-muted">No reservations today.</p>
        ) : (
          queue.map((car, i) => (
            <div key={i} className="card card-body flex justify-between items-center">
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.125rem' }} dir="ltr">{car.plate_number || car.reference}</div>
                <div className="text-muted text-sm">{car.time} • {car.type}</div>
              </div>
              <span className={`badge badge-${car.status === 'completed' ? 'success' : car.status === 'in_progress' ? 'info' : 'warning'}`}>
                {car.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- App Root ---
function App() {
  return (
    <I18nProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="book" element={<Book />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            {/* Add more admin routes as needed */}
          </Route>
        </Routes>
      </Router>
    </I18nProvider>
  );
}

export default App;
