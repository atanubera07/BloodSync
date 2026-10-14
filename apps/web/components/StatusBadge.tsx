type RequestStatus = 'OPEN' | 'CLOSED' | 'EXPIRED';
type Urgency = 'NORMAL' | 'URGENT';

type Props = { kind: 'request'; value: RequestStatus } | { kind: 'urgency'; value: Urgency };

export function StatusBadge({ kind, value }: Props) {
  const label =
    kind === 'urgency'
      ? value === 'URGENT'
        ? 'Urgent need'
        : 'Standard need'
      : value === 'OPEN'
        ? 'Open request'
        : value === 'CLOSED'
          ? 'Closed request'
          : 'Expired request';
  const tone =
    (kind === 'urgency' && value === 'URGENT') || (kind === 'request' && value === 'EXPIRED')
      ? 'attention'
      : kind === 'request' && value === 'OPEN'
        ? 'positive'
        : 'neutral';

  return <span className={`status-badge status-badge-${tone}`}>{label}</span>;
}
