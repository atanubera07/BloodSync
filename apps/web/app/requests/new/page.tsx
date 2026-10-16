'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountGate } from '../../../components/AccountGate';
import { WorkspaceFrame } from '../../../components/WorkspaceFrame';
import { RequestForm } from '../../../components/RequestForm';
export default function NewRequestPage() {
  const router = useRouter();
  return (
    <AccountGate role="USER">
      {() => (
        <WorkspaceFrame role="USER" active="/requests">
          <section className="content-panel">
            <Link href="/requests">← Your requests</Link>
            <span className="workspace-kicker form-kicker">Patient request</span>
            <h1>Create a blood request</h1>
            <p>
              If this is a medical emergency, contact your hospital or local emergency services
              directly.
            </p>
            <RequestForm onSaved={(request) => router.push(`/requests/${request.id}`)} />
          </section>
        </WorkspaceFrame>
      )}
    </AccountGate>
  );
}
