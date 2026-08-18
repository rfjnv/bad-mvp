/**
 * Липкая нижняя панель для мобильного: слева сумма, справа действие.
 * Без неё кнопка покупки уезжает вверх ровно тогда, когда человек
 * дочитал карточку и решился, а на чекауте она вообще уходит под клавиатуру.
 * На десктопе не показывается — там кнопка и так в поле зрения.
 */
export default function StickyBar({
  label,
  value,
  hint,
  action,
}: {
  label: string;
  value: string;
  hint?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white/95 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-4">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[13px] text-text-dim">{label}</span>
          <span className="text-lg font-semibold tracking-tight truncate">{value}</span>
          {hint && <span className="text-[12px] text-text-dim truncate">{hint}</span>}
        </div>
        {action}
      </div>
    </div>
  );
}
