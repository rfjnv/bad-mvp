"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Горизонтальная лента со snap-скроллом и точками-индикаторами.
 * Без индикаторов человек не понимает, что ленту можно листать,
 * и просто пролистывает мимо остальных карточек.
 */
export default function ScrollCarousel({
  count,
  children,
  trackClassName = "",
  dotsClassName = "",
}: {
  count: number;
  children: React.ReactNode;
  trackClassName?: string;
  dotsClassName?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || count < 2) return;

    const onScroll = () => {
      const step = el.scrollWidth / count;
      const index = Math.round(el.scrollLeft / step);
      setActive(Math.min(count - 1, Math.max(0, index)));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [count]);

  const goTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: (el.scrollWidth / count) * index, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={trackRef}
        className={`flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${trackClassName}`}
      >
        {children}
      </div>

      {count > 1 && (
        <div className={`flex items-center justify-center gap-2 ${dotsClassName}`}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Слайд ${i + 1} из ${count}`}
              aria-current={i === active}
              className="w-11 h-11 flex items-center justify-center"
            >
              <span
                className={`block h-[3px] transition-all duration-150 ${
                  i === active ? "w-6 bg-text" : "w-3 bg-border"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
