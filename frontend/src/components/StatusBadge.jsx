const statusConfig = {
  pending:     { label: 'Pending',     classes: 'bg-yellow-100 text-yellow-800' },
  assigned:    { label: 'Assigned',    classes: 'bg-blue-100 text-blue-800' },
  accepted:    { label: 'Accepted',    classes: 'bg-indigo-100 text-indigo-800' },
  in_progress: { label: 'In Progress', classes: 'bg-purple-100 text-purple-800' },
  completed:   { label: 'Completed',   classes: 'bg-green-100 text-green-800' },
  cancelled:   { label: 'Cancelled',   classes: 'bg-gray-100 text-gray-600' },
  rejected:    { label: 'Rejected',    classes: 'bg-red-100 text-red-800' },
};

const priorityConfig = {
  low:    { label: 'Low',    classes: 'bg-gray-100 text-gray-600' },
  medium: { label: 'Medium', classes: 'bg-blue-100 text-blue-700' },
  high:   { label: 'High',   classes: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', classes: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-600' };
  return <span className={`badge ${config.classes}`}>{config.label}</span>;
}

export function PriorityBadge({ priority }) {
  const config = priorityConfig[priority] || { label: priority, classes: 'bg-gray-100 text-gray-600' };
  return <span className={`badge ${config.classes}`}>{config.label}</span>;
}
