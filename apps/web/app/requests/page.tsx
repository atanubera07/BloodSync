'use client';
import { useEffect, useState } from 'react';
import { AccountGate } from '../../components/AccountGate';
import { apiJson } from '../../lib/api';
import type { BloodRequest } from '../../components/RequestForm';
function List() {
  const [items, setItems] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setError('');
    try {
      setItems(await apiJson<BloodRequest[]>('/requests'));
    } catch {
      setError('Could not load your requests.');
    } finally {
      setLoading(false);
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
        <a className="button" href="/requests/new">
          Create request
        </a>
      </div>
      {loading ? (
        <p role="status">Loading requests…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => void load()}>Retry</button>
        </div>
      ) : items.length === 0 ? (
        <p className="empty">
          You have no requests yet. <a href="/requests/new">Create your first request</a>.
        </p>
      ) : (
        <div className="card-grid">
          {items.map((item) => (
            <article className="card" key={item.id}>
              <div className="card-top">
                <strong>{item.bloodGroup}</strong>
                <span className="badge">{item.status.toLowerCase()}</span>
              </div>
              <h2>{item.hospitalName}</h2>
              <p>
                {item.city} · {item.units} unit{item.units === 1 ? '' : 's'}
              </p>
              <p>Expires {new Date(item.expiresAt).toLocaleString()}</p>
              <a href={`/requests/${item.id}`}>View request and matches</a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
export default function RequestsPage() {
  return <AccountGate role="USER">{() => <List />}</AccountGate>;
}
