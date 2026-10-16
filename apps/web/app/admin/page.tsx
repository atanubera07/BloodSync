'use client';
import { useState } from 'react';
import { AccountGate } from '../../components/AccountGate';
import { WorkspaceFrame } from '../../components/WorkspaceFrame';
import { apiJson } from '../../lib/api';
import { useResource } from '../../lib/use-resource';
import { assessDonorEligibility } from '@bloodsync/shared';
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
const loadAdmin = async () => {
  const [donors, events] = await Promise.all([
    apiJson<Donor[]>('/admin/donors'),
    apiJson<Audit[]>('/admin/audit'),
  ]);
  return { donors, events };
};
function AdminDashboard() {
  const { data, loading, error, setError, reload } = useResource(
    loadAdmin,
    'Could not load the review queue.',
  );
  const donors = data?.donors ?? [];
  const events = data?.events ?? [];
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState('');
  async function review(id: string, decision: 'approve' | 'reject') {
    setPending(id);
    setError('');
    setNotice('');
    try {
      await apiJson(`/admin/donors/${id}/${decision}`, { method: 'POST' });
      setNotice(`Donor ${decision === 'approve' ? 'approved' : 'rejected'}.`);
      reload();
    } catch {
      setError('Review failed. Reload the queue and try again.');
    } finally {
      setPending('');
    }
  }
  return (
    <WorkspaceFrame role="ADMIN" active="/admin">
      <section>
        <div className="workspace-header">
          <div>
            <span className="workspace-kicker">Admin workspace</span>
            <h1>Donor review</h1>
            <p>Thoughtful decisions start with a clear view of each profile.</p>
          </div>
          <span className="badge">Review queue</span>
        </div>
        <div className="review-summary" aria-label="Review overview">
          <div>
            <strong>{loading ? '…' : donors.length}</strong>
            <span>Profiles awaiting review</span>
          </div>
          <p>
            Approval enables matching. A qualified medical team still decides final donation
            eligibility.
          </p>
        </div>
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
            <button onClick={reload}>Retry</button>
          </div>
        ) : (
          <>
            <h2>Pending donors ({donors.length})</h2>
            {donors.length === 0 ? (
              <p className="empty">No profiles need review.</p>
            ) : (
              <div className="card-grid">
                {donors.map((donor) => {
                  const screeningReasons = assessDonorEligibility({
                    birthDate: new Date(donor.birthDate),
                    weightKg: Number(donor.weightKg),
                    lastDonationAt: donor.lastDonationAt ? new Date(donor.lastDonationAt) : null,
                  });
                  return (
                    <article className="card review-card" key={donor.id}>
                      <div className="review-card-header">
                        <div>
                          <h3>{donor.user.fullName}</h3>
                          <p>{donor.user.email}</p>
                        </div>
                        <span className="badge">Awaiting review</span>
                      </div>
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
                      {screeningReasons.length > 0 && (
                        <p className="error" role="status">
                          Screening flags: {screeningReasons.join('; ')}. Approval is blocked by the
                          API.
                        </p>
                      )}
                      <div className="actions review-actions">
                        <button
                          disabled={pending === donor.id || screeningReasons.length > 0}
                          onClick={() => {
                            if (
                              window.confirm(
                                'Approve this profile for matching? Confirm that the screening details have been reviewed. This does not replace clinical eligibility checks.',
                              )
                            )
                              void review(donor.id, 'approve');
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="secondary"
                          disabled={pending === donor.id}
                          onClick={() => {
                            if (
                              window.confirm(
                                'Reject this donor profile? The donor may update and resubmit it.',
                              )
                            )
                              void review(donor.id, 'reject');
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </article>
                  );
                })}
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
    </WorkspaceFrame>
  );
}
export default function AdminPage() {
  return <AccountGate role="ADMIN">{() => <AdminDashboard />}</AccountGate>;
}
