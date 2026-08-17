export default function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 gap-2">
      <div className="text-lg font-semibold">{title}</div>
      {hint && <div className="text-sm text-text-dim max-w-sm">{hint}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
