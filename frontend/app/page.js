'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import ResultCard from '@/components/ResultCard';
import UploadZone from '@/components/UploadZone';

export default function Home() {
  const { data: session } = useSession();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [patient, setPatient] = useState({ name: '', age: '', id: '' });

  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  const handleImageSelect = (file) => {
    setResult(null); setError(null);
    setImage(file); setImagePreview(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('patientName', patient.name);
      formData.append('patientAge', patient.age);
      formData.append('patientId', patient.id);

      const response = await fetch('/api/predict', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Prediction failed. Please try again.');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null); setImagePreview(null); setResult(null); setError(null);
    setPatient({ name: '', age: '', id: '' });
  };

  return (
    <main className="main">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">DRISHTI</span>
        </div>
        <div className="header-right">
          {session ? (
            <>
              <Link href="/dashboard" className="header-link">Dashboard</Link>
              <button className="header-signout" onClick={() => signOut({ callbackUrl: '/login' })}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="header-link">Sign in</Link>
              <Link href="/register" className="header-link primary">Get started</Link>
            </>
          )}
        </div>
      </header>

      {session && (
        <div className="save-notice">
          ✓ Signed in as <strong>{session.user.name || session.user.email}</strong> — results will be saved to your history
        </div>
      )}

      <section className="hero">
        <h1 className="hero-title">Early Detection.<br /><span className="accent">Clearer Vision.</span></h1>
        <p className="hero-sub">Upload a retinal fundus image and DRISHTI will grade Diabetic Retinopathy severity in seconds.</p>
      </section>

      <section className="workspace">
        {!result ? (
          <div className="upload-panel">
            <UploadZone onImageSelect={handleImageSelect} imagePreview={imagePreview} onReset={handleReset} />

            {image && (
              <div className="patient-fields">
                <input className="patient-input" placeholder="Patient name (optional)" value={patient.name} onChange={e => setPatient(p => ({ ...p, name: e.target.value }))} />
                <input className="patient-input" placeholder="Age (optional)" value={patient.age} onChange={e => setPatient(p => ({ ...p, age: e.target.value }))} />
                <input className="patient-input" placeholder="Patient ID (optional)" value={patient.id} onChange={e => setPatient(p => ({ ...p, id: e.target.value }))} />
              </div>
            )}

            {error && <p className="error-msg">⚠ {error}</p>}

            {image && !loading && (
              <button className="analyze-btn" onClick={handleAnalyze}>
                Analyze Image <span className="btn-arrow">→</span>
              </button>
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner" />
                <div className="loading-steps">
                  <span className="step active">Preprocessing image</span>
                  <span className="step active">Running DRISHTI model</span>
                  <span className="step">Applying TTA</span>
                </div>
                <span className="elapsed">{elapsed}s elapsed</span>
                {elapsed >= 20 && (
                  <span className="wakeup-hint">☕ Model server may be waking up — this can take up to 60s on first use.</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <ResultCard result={result} imagePreview={imagePreview} onReset={handleReset} />
        )}
      </section>

      <section className="grades-info">
        <h2 className="section-title">DR Severity Scale</h2>
        <div className="grades-grid">
          {GRADES.map(g => (
            <div key={g.grade} className="grade-card" style={{ '--accent': g.color }}>
              <span className="grade-num">{g.grade}</span>
              <span className="grade-label">{g.label}</span>
              <span className="grade-desc">{g.desc}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>DRISHTI · KIET Delhi-NCR · Accuracy 91.4% · QWK 0.87</p>
      </footer>
    </main>
  );
}

const GRADES = [
  { grade: 0, label: 'No DR',         desc: 'No signs detected',        color: '#22c55e' },
  { grade: 1, label: 'Mild',          desc: 'Microaneurysms only',       color: '#84cc16' },
  { grade: 2, label: 'Moderate',      desc: 'More than microaneurysms',  color: '#f59e0b' },
  { grade: 3, label: 'Severe',        desc: 'No PDR, extensive lesions', color: '#f97316' },
  { grade: 4, label: 'Proliferative', desc: 'High-risk, urgent care',    color: '#ef4444' },
];
