/**
 * Перемонтируется на каждый переход — страница мягко проявляется.
 * Только opacity: transform на обёртке сделал бы её containing block
 * для position:fixed, и липкая панель покупки уехала бы вместе со страницей.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
