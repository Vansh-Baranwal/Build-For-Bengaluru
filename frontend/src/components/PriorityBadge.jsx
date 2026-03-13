export default function PriorityBadge({ priority }) {
  const styles = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[priority] || styles.medium}`}>
      {priority?.toUpperCase() || 'MEDIUM'}
    </span>
  );
}
