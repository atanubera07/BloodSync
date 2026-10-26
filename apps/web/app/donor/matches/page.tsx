'use client';
import { useState } from 'react';
import { AccountGate } from '../../../components/AccountGate';
import { WorkspaceFrame } from '../../../components/WorkspaceFrame';
import { StatusBadge } from '../../../components/StatusBadge';
import { EmptyState } from '../../../components/EmptyState';
import { apiJson, ApiError } from '../../../lib/api';
import { useResource } from '../../../lib/use-resource';
type Match = {
  id: string;
  bloodGroup: string;
  units: number;
  urgency: 'NORMAL' | 'URGENT';
  hospitalName: string;
  city: string;
  expiresAt: string;
  distanceKm: number | null;
  responded: boolean;
};
type MatchResult = { items: Match[]; blocked?: 'missing-profile' | 'review-consent' };
const loadMatches = async (): Promise<MatchResult> => {
  try {
    return { items: await apiJson<Match[]>('/donors/me/matches') };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404)
      return { items: [], blocked: 'missing-profile' };
    if (error instanceof ApiError && error.status === 403)
      return { items: [], blocked: 'review-consent' };
    throw error;
  }
};
function Matches() {
  const { data, setData, loading, error, setError, reload } = useResource(
    loadMatches,
    'Could not load matching requests.',
  );
  const items = data?.items ?? [];
  const [pending, setPending] = useState('');
  async function respond(id: string) {
    setPending(id);
    setError('');
    try {
      await apiJson(`/donors/me/interests/${id}`, { method: 'POST' });
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === id ? { ...item, responded: true } : item,
              ),
            }
          : current,
      );
    } catch (message) {
      setError(String(message instanceof Error ? message.message : message));
    } finally {
      setPending('');
    }
  }
  return (
    <section>
      <h1>Requests you can help with</h1>
      <p>
        Responding shares your name and account email with the request owner. Contact the hospital
        to confirm all medical details.
      </p>
      {loading ? (
        <p role="status">Finding requests…</p>
      ) : error ? (
        <div role="alert">
          <p className="error">{error}</p>
          <button onClick={reload}>Retry</button>
        </div>
      ) : data?.blocked ? (
        <EmptyState
          eyebrow="Before matching starts"
          title={
            data.blocked === 'missing-profile'
              ? 'Start with your donor profile.'
              : 'Review your approval and consent.'
          }
          action={{ href: '/donor/profile', label: 'Open donor profile' }}
        >
          Matching needs an approved donor profile, your matching choice, and current consent to
          process screening details and share contact information.
        </EmptyState>
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="No matches right now"
          title="Check back as needs change."
          action={{ href: '/donor/profile', label: 'Review your donor profile' }}
        >
          Matching depends on your approved profile, location, and active requests.
        </EmptyState>
      ) : (
        <div className="card-grid record-grid">
          {items.map((item) => (
            <article className="card" key={item.id}>
              <div className="card-top">
                <strong>{item.bloodGroup}</strong>
                <StatusBadge kind="urgency" value={item.urgency} />
              </div>
              <h2>{item.hospitalName}</h2>
              <p>
                {item.city}
                {item.distanceKm !== null ? ` · ${item.distanceKm} km away` : ''}
              </p>
              <p>
                {item.units} unit{item.units === 1 ? '' : 's'} · Expires{' '}
                {new Date(item.expiresAt).toLocaleString()}
              </p>
              <button
                disabled={item.responded || pending === item.id}
                onClick={() => void respond(item.id)}
              >
                {item.responded
                  ? 'Interest shared'
                  : pending === item.id
                    ? 'Sharing…'
                    : 'I can help'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
export default function DonorMatchesPage() {
  return (
    <AccountGate role="USER">
      {() => (
        <WorkspaceFrame role="USER" active="/donor/matches">
          <Matches />
        </WorkspaceFrame>
      )}
    </AccountGate>
  );
}
