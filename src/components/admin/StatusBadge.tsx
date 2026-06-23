'use client'

type StatusType = 
  | 'success' // Active, Completed, Paid, Delivered
  | 'warning' // Pending, Low Stock, Due
  | 'danger'  // Inactive, Cancelled, Out of Stock, Failed
  | 'info'    // Draft, Vacation, Processing
  | 'default' // Default grey

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
}

export function StatusBadge({ status, type = 'default' }: StatusBadgeProps) {
  // Auto-map common statuses if type isn't explicitly provided
  let determinedType = type;
  if (type === 'default') {
    const s = status.toLowerCase();
    if (['active', 'completed', 'paid', 'delivered', 'optimal', 'ready'].includes(s)) determinedType = 'success';
    else if (['pending', 'low stock', 'due', 'generating', 'waitlist'].includes(s)) determinedType = 'warning';
    else if (['inactive', 'cancelled', 'out of stock', 'failed', 'dropped'].includes(s)) determinedType = 'danger';
    else if (['draft', 'vacation', 'processing', 'scheduled'].includes(s)) determinedType = 'info';
  }

  const styles = {
    success: { bg: '#dcfce7', text: '#16a34a', border: '#bbf7d0' },
    warning: { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
    danger:  { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' },
    info:    { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' },
    default: { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
  };

  const currentStyle = styles[determinedType];

  return (
    <span 
      className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.5px]"
      style={{
        background: currentStyle.bg,
        color: currentStyle.text,
        border: `1.5px solid ${currentStyle.border}`
      }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
        style={{ background: currentStyle.text }}
      />
      {status}
    </span>
  );
}
