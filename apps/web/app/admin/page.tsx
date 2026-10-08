'use client';
import { useEffect, useState } from 'react';
import { AccountGate } from '../../components/AccountGate';
import { apiJson } from '../../lib/api';
type Donor = {
  id: string;
  bloodGroup: string;
  birthDate: string;
  weightKg: string;
  lastDonationAt: string | null;
  city: string;
  consentToMatch: boolean;
  createdAt: string;
  user: { fullName: string; email: string };
};
type Audit = { id: string; action: string; targetId: string | null; createdAt: string };
function AdminDashboard() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [events, setEvents] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState('');
  async function load() {
    setError('');
    try {
      const [queue, audit] = await Promise.all([
        apiJson<Donor[]>('/admin/donors'),
        apiJson<Audit[]>('/admin/audit'),
      ]);
      setDonors(queue);
      setEvents(audit);
    } catch {
      setError('Could not load the review queue.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function review(id: string, decision: 'approve' | 'reject') {
    setPending(id);
    setError('');
    setNotice('');
    try {
      await apiJson(`/admin/donors/${id}/${decision}`, { method: 'POST' });
      setNotice(`Donor ${decision === 'approve' ? 'approved' : 'rejected'}.`);
      await load();
    } catch {
      setError('Review failed. Reload the queue and try again.');
    } finally {
      setPending('');
    }
  }
  return (
    <section>
      <h1>Admin review</h1>
      <p>
        Review donor screening details before approval. Medical eligibility must still be confirmed
        by a qualified professional.
      </p>
      {notice && (
        <p role="status" className="success">
          {notice}
        </p>
      )}
      {loading ? (
        <p role="status">Loading review queue…</p>
      ) : error ? (
        <div role="alert">
          <p className="error">{error}</p>
          <button onClick={() => void load()}>Retry</button>
        </div>
      ) : (
        <>
          <h2>Pending donors ({donors.length})</h2>
          {donors.length === 0 ? (
            <p className="empty">No profiles need review.</p>
          ) : (
            <div className="card-grid">
              {donors.map((donor) => (
                <article className="card" key={donor.id}>
                  <h3>{donor.user.fullName}</h3>
                  <p>{donor.user.email}</p>
                  <dl>
                    <dt>Blood group</dt>
                    <dd>{donor.bloodGroup}</dd>
                    <dt>Birth date</dt>
                    <dd>{donor.birthDate.slice(0, 10)}</dd>
                    <dt>Weight</dt>
                    <dd>{donor.weightKg} kg</dd>
                    <dt>Last donation</dt>
                    <dd>{donor.lastDonationAt?.slice(0, 10) || 'Not reported'}</dd>
                    <dt>City</dt>
                    <dd>{donor.city}</dd>
                    <dt>Matching consent</dt>
                    <dd>{donor.consentToMatch ? 'Yes' : 'No'}</dd>
                  </dl>
                  <div className="actions">
                    <button
                      disabled={pending === donor.id}
                      onClick={() => void review(donor.id, 'approve')}
                    >
                      Approve
                    </button>
                    <button
                      className="secondary"
                      disabled={pending === donor.id}
                      onClick={() => void review(donor.id, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <h2>Recent decisions</h2>
          {events.length === 0 ? (
            <p className="empty">No review events yet.</p>
          ) : (
            <ul className="simple-list">
              {events.map((event) => (
                <li key={event.id}>
                  {event.action.replaceAll('_', ' ').toLowerCase()} ·{' '}
                  {new Date(event.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
export default function AdminPage() {
  return <AccountGate role="ADMIN">{() => <AdminDashboard />}</AccountGate>;
}
