'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AccountGate } from '../../components/AccountGate';
import { WorkspaceFrame } from '../../components/WorkspaceFrame';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { apiJson } from '../../lib/api';
import type { BloodRequest } from '../../components/RequestForm';
function List() {
  const [items, setItems] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  async function load(skip = 0) {
    if (skip) setMore(true);
    else setLoading(true);
    setError('');
    try {
      const page = await apiJson<BloodRequest[]>(`/requests?skip=${skip}`);
      setItems((current) => (skip ? [...current, ...page] : page));
      setHasMore(page.length === 20);
    } catch {
      setError('Could not load your requests.');
    } finally {
      setLoading(false);
      setMore(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <section>
      <div className="section-heading">
        <div>
          <h1>Your blood requests</h1>
          <p>Only you can view and manage these requests.</p>
        </div>
        <Link className="button" href="/requests/new">
          Create request
        </Link>
      </div>
      {loading ? (
        <p role="status">Loading requests…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => void load(0)}>Retry</button>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          eyebrow="No requests yet"
          title="A request starts here."
          action={{ href: '/requests/new', label: 'Create your first request' }}
        >
          Add the details confirmed by your care team when you need donor support.
        </EmptyState>
      ) : (
        <>
          <div className="card-grid record-grid">
            {items.map((item) => (
              <article className="card" key={item.id}>
                <div className="card-top">
                  <strong>{item.bloodGroup}</strong>
                  <StatusBadge kind="request" value={item.status} />
                </div>
                <h2>{item.hospitalName}</h2>
                <p>
                  {item.city} · {item.units} unit{item.units === 1 ? '' : 's'}
                </p>
                {item.urgency === 'URGENT' && (
                  <p>
                    <StatusBadge kind="urgency" value={item.urgency} />
                  </p>
                )}
                <p>Expires {new Date(item.expiresAt).toLocaleString()}</p>
                <Link href={`/requests/${item.id}`}>View request and matches</Link>
              </article>
            ))}
          </div>
          {hasMore && (
            <button type="button" disabled={more} onClick={() => void load(items.length)}>
              {more ? 'Loading…' : 'Load more requests'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
export default function RequestsPage() {
  return (
    <AccountGate role="USER">
      {() => (
        <WorkspaceFrame role="USER" active="/requests">
          <List />
        </WorkspaceFrame>
      )}
    </AccountGate>
  );
}
