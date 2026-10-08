'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountGate } from '../../../components/AccountGate';
import { RequestForm } from '../../../components/RequestForm';
export default function NewRequestPage() {
  const router = useRouter();
  return (
    <AccountGate role="USER">
      {() => (
        <section className="content-panel">
          <Link href="/requests">← Your requests</Link>
          <h1>Create a blood request</h1>
          <p>
            If this is a medical emergency, contact your hospital or local emergency services
            directly.
          </p>
          <RequestForm onSaved={(request) => router.push(`/requests/${request.id}`)} />
        </section>
      )}
    </AccountGate>
  );
}
