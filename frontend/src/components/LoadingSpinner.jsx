export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-primary-600 ${sizes[size]}`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
