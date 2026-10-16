type RequestStatus = 'OPEN' | 'CLOSED' | 'EXPIRED';
type Urgency = 'NORMAL' | 'URGENT';
type DonorStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type Props =
  | { kind: 'request'; value: RequestStatus }
  | { kind: 'urgency'; value: Urgency }
  | { kind: 'donor'; value: DonorStatus };

export function StatusBadge({ kind, value }: Props) {
  const label =
    kind === 'donor'
      ? value === 'APPROVED'
        ? 'Approved for matching'
        : value === 'PENDING'
          ? 'Awaiting review'
          : 'Needs an update'
      : kind === 'urgency'
        ? value === 'URGENT'
          ? 'Urgent need'
          : 'Standard need'
        : value === 'OPEN'
          ? 'Open request'
          : value === 'CLOSED'
            ? 'Closed request'
            : 'Expired request';
  const tone =
    (kind === 'urgency' && value === 'URGENT') ||
    (kind === 'request' && value === 'EXPIRED') ||
    (kind === 'donor' && value === 'REJECTED')
      ? 'attention'
      : (kind === 'request' && value === 'OPEN') || (kind === 'donor' && value === 'APPROVED')
        ? 'positive'
        : 'neutral';

  return <span className={`status-badge status-badge-${tone}`}>{label}</span>;
}
