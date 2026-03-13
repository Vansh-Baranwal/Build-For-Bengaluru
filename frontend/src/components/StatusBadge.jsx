export default function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
  };

  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    resolved: 'Resolved',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}
