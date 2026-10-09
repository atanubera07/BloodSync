'use client';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import { AccountGate } from '../../../components/AccountGate';
import { WorkspaceFrame } from '../../../components/WorkspaceFrame';
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
  const loadRequest = useCallback(() => apiJson<BloodRequest>(`/requests/${id}`), [id]);
  const loadMatches = useCallback(() => apiJson<Match[]>(`/requests/${id}/matches`), [id]);
  const loadInterests = useCallback(() => apiJson<Interest[]>(`/requests/${id}/interests`), [id]);
  const {
    data: request,
    setData: setRequest,
    loading,
    error: loadError,
    reload: reloadRequest,
  } = useResource(
    loadRequest,
    'Unable to load this request. It may have been removed or belong to another account.',
  );
  const {
    data: matchData,
    loading: matchesLoading,
    error: matchesError,
    reload: reloadMatches,
  } = useResource(loadMatches, 'Unable to load matches.');
  const {
    data: interestData,
    loading: interestsLoading,
    error: interestsError,
    reload: reloadInterests,
  } = useResource(loadInterests, 'Unable to load donor responses.');
  const matches = matchData ?? [];
  const interests = interestData ?? [];
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  async function close() {
    if (
      !request ||
      closing ||
      !window.confirm('Close this request? Donors will no longer be able to respond.')
    )
      return;
    setClosing(true);
    setError('');
    try {
      await apiJson(`/requests/${request.id}`, { method: 'DELETE' });
      setRequest((current) => (current ? { ...current, status: 'CLOSED' } : current));
      setNotice('Request closed.');
      reloadRequest();
      reloadMatches();
      reloadInterests();
    } catch {
      setError('Could not close the request. Try again.');
    } finally {
      setClosing(false);
    }
  }
  return (
    <section>
      <Link href="/requests">← Your requests</Link>
      {loading ? (
        <p role="status">Loading request…</p>
      ) : loadError ? (
        <div role="alert">
          <p className="error">{loadError}</p>
          <button onClick={reloadRequest}>Retry</button>
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
                <button disabled={closing} onClick={() => void close()}>
                  {closing ? 'Closing…' : 'Close request'}
                </button>
              </div>
            )}
          </div>
          <p>Expires {new Date(request.expiresAt).toLocaleString()}</p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
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
                  setRequest(updated);
                  setEditing(false);
                  setNotice(
                    'Request updated. Previous donor responses were cleared because the details changed.',
                  );
                  reloadRequest();
                  reloadMatches();
                  reloadInterests();
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
              {matchesLoading ? (
                <p role="status">Loading matches…</p>
              ) : matchesError ? (
                <div role="alert">
                  <p>{matchesError}</p>
                  <button onClick={reloadMatches}>Retry matches</button>
                </div>
              ) : matches.length === 0 ? (
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
              {interestsLoading ? (
                <p role="status">Loading donor responses…</p>
              ) : interestsError ? (
                <div role="alert">
                  <p>{interestsError}</p>
                  <button onClick={reloadInterests}>Retry responses</button>
                </div>
              ) : interests.length === 0 ? (
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
  return (
    <AccountGate role="USER">
      {() => (
        <WorkspaceFrame role="USER" active="/requests">
          <Detail id={params.id} />
        </WorkspaceFrame>
      )}
    </AccountGate>
  );
}
