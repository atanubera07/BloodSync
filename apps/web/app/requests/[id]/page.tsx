'use client';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { AccountGate } from '../../../components/AccountGate';
import { RequestForm, type BloodRequest } from '../../../components/RequestForm';
import { apiJson } from '../../../lib/api';
import { useResource } from '../../../lib/use-resource';
type Match = { id: string; bloodGroup: string; city: string; distanceKm: number | null };
type Interest = {
  id: string;
  consentAt: string;
  donor: { bloodGroup: string; city: string; user: { fullName: string; email: string } };
};
function Detail({ id }: { id: string }) {
  const load = useCallback(async () => {
    const [request, matches, interests] = await Promise.all([
      apiJson<BloodRequest>(`/requests/${id}`),
      apiJson<Match[]>(`/requests/${id}/matches`),
      apiJson<Interest[]>(`/requests/${id}/interests`),
    ]);
    return { request, matches, interests };
  }, [id]);
  const { data, setData, loading, error: loadError, reload } = useResource(load, 'Unable to load this request. It may have been removed or belong to another account.');
  const request = data?.request ?? null;
  const matches = data?.matches ?? [];
  const interests = data?.interests ?? [];
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);
  async function close() {
    if (!request) return;
    setError('');
    try {
      await apiJson(`/requests/${request.id}`, { method: 'DELETE' });
      setNotice('Request closed.');
      reload();
    } catch {
      setError('Could not close the request. Try again.');
    }
  }
  return (
    <section>
      <Link href="/requests">← Your requests</Link>
      {loading ? (
        <p role="status">Loading request…</p>
      ) : error || loadError ? (
        <div role="alert">
          <p className="error">{error || loadError}</p>
          <button onClick={() => { setError(''); reload(); }}>Retry</button>
        </div>
      ) : request ? (
        <>
          <div className="section-heading">
            <div>
              <h1>{request.hospitalName}</h1>
              <p>
                {request.bloodGroup} · {request.units} unit{request.units === 1 ? '' : 's'} ·{' '}
                {request.city} · {request.status.toLowerCase()}
              </p>
            </div>
            {request.status === 'OPEN' && (
              <div className="actions">
                <button className="secondary" onClick={() => setEditing(!editing)}>
                  {editing ? 'Cancel edit' : 'Edit request'}
                </button>
                <button onClick={() => void close()}>Close request</button>
              </div>
            )}
          </div>
          <p>Expires {new Date(request.expiresAt).toLocaleString()}</p>
          {notice && (
            <p role="status" className="success">
              {notice}
            </p>
          )}
          {editing && (
            <div className="content-panel">
              <h2>Edit request</h2>
              <RequestForm
                initial={request}
                onSaved={(updated) => {
                  setData((current) => current ? { ...current, request: updated } : current);
                  setEditing(false);
                  setNotice(
                    'Request updated. Previous donor responses were cleared because the details changed.',
                  );
                  reload();
                }}
              />
            </div>
          )}
          <div className="two-column">
            <section>
              <h2>Matching donors</h2>
              <p>
                These approved donors opted into anonymous matching. Contact details appear only
                after they respond.
              </p>
              {matches.length === 0 ? (
                <p className="empty">No matching donors found yet.</p>
              ) : (
                <ul className="simple-list">
                  {matches.map((match) => (
                    <li key={match.id}>
                      {match.bloodGroup} donor · {match.city}
                      {match.distanceKm !== null ? ` · ${match.distanceKm} km` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2>Donors who responded</h2>
              {interests.length === 0 ? (
                <p className="empty">No donor has responded yet.</p>
              ) : (
                <ul className="simple-list">
                  {interests.map((item) => (
                    <li key={item.id}>
                      <strong>{item.donor.user.fullName}</strong> · {item.donor.bloodGroup} ·{' '}
                      {item.donor.city}
                      <br />
                      <a href={`mailto:${item.donor.user.email}`}>{item.donor.user.email}</a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  return <AccountGate role="USER">{() => <Detail id={params.id} />}</AccountGate>;
}
