'use client';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import styles from './dashboard.module.css';

const GRADE_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];
const GRADE_LABELS = ['No DR', 'Mild DR', 'Moderate DR', 'Severe DR', 'Proliferative DR'];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/scans')
      .then(r => r.json())
      .then(d => { setScans(d.scans || []); setLoading(false); });
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Loading your dashboard…</p>
      </div>
    );
  }

  const chartData = [...scans].reverse().map(s => ({
    date: new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    grade: s.grade,
    gradeName: s.gradeName,
  }));

  const avgConfidence = scans.length
    ? (scans.reduce((a, s) => a + s.confidence, 0) / scans.length).toFixed(1)
    : 0;

  const latestGrade = scans[0]?.grade ?? null;

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.navLogo}>
          <span className={styles.logoIcon}>◈</span>
          <span className={styles.logoText}>DRISHTI</span>
        </Link>
        <div className={styles.navRight}>
          <span className={styles.userEmail}>{session?.user?.name || session?.user?.email}</span>
          <Link href="/" className={styles.navBtn}>New scan</Link>
          <button className={styles.signOutBtn} onClick={() => signOut({ callbackUrl: '/login' })}>
            Sign out
          </button>
        </div>
      </nav>

      <main className={styles.main}>
        <h1 className={styles.heading}>Your scans</h1>

        {/* Stat cards */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{scans.length}</span>
            <span className={styles.statLabel}>Total scans</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{avgConfidence}%</span>
            <span className={styles.statLabel}>Avg confidence</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum} style={{ color: latestGrade !== null ? GRADE_COLORS[latestGrade] : 'inherit' }}>
              {latestGrade !== null ? GRADE_LABELS[latestGrade] : '—'}
            </span>
            <span className={styles.statLabel}>Latest result</span>
          </div>
        </div>

        {scans.length === 0 ? (
          <div className={styles.empty}>
            <p>No scans yet.</p>
            <Link href="/" className={styles.uploadLink}>Upload your first retinal scan →</Link>
          </div>
        ) : (
          <>
            {/* Grade trend chart */}
            {scans.length >= 2 && (
              <div className={styles.chartCard}>
                <h2 className={styles.sectionTitle}>DR grade over time</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#181c23', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13 }}
                      labelStyle={{ color: '#9ca3af' }}
                      formatter={(v) => [GRADE_LABELS[v], 'Grade']}
                    />
                    <ReferenceLine y={2} stroke="rgba(245,158,11,0.2)" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="grade"
                      stroke="#4f8ef7"
                      strokeWidth={2}
                      dot={{ r: 5, fill: '#4f8ef7', strokeWidth: 0 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className={styles.chartHint}>Dashed line = moderate DR threshold. Upward trend needs attention.</p>
              </div>
            )}

            {/* Scans table */}
            <div className={styles.tableCard}>
              <h2 className={styles.sectionTitle}>Scan history</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Patient</th>
                      <th>Grade</th>
                      <th>Confidence</th>
                      <th>Severity</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.map(scan => (
                      <tr key={scan.id} className={styles.row} onClick={() => setSelected(selected?.id === scan.id ? null : scan)}>
                        <td className={styles.dateCell}>
                          {new Date(scan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td>{scan.patientName || <span className={styles.dim}>—</span>}</td>
                        <td>
                          <span className={styles.gradeBadge} style={{ '--c': GRADE_COLORS[scan.grade] }}>
                            {scan.grade} · {scan.gradeName}
                          </span>
                        </td>
                        <td>{scan.confidence.toFixed(1)}%</td>
                        <td className={styles.dim}>{scan.remedy?.severity}</td>
                        <td className={styles.expandIcon}>{selected?.id === scan.id ? '▲' : '▼'}</td>
                      </tr>
                    ))}
                    {selected && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={6}>
                          <div className={styles.expandedContent}>
                            <div className={styles.expandedProbs}>
                              {GRADE_LABELS.map((label, i) => (
                                <div key={i} className={styles.probRow}>
                                  <span className={styles.probLabel}>{i} · {label}</span>
                                  <div className={styles.probTrack}>
                                    <div className={styles.probFill} style={{
                                      width: `${(selected.probabilities[i] * 100).toFixed(1)}%`,
                                      background: i === selected.grade ? GRADE_COLORS[i] : 'rgba(255,255,255,0.1)',
                                    }} />
                                  </div>
                                  <span className={styles.probPct}>{(selected.probabilities[i] * 100).toFixed(1)}%</span>
                                </div>
                              ))}
                            </div>
                            {selected.remedy?.recommendations?.length > 0 && (
                              <ul className={styles.recs}>
                                {selected.remedy.recommendations.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
