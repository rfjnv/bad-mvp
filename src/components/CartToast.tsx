"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CART_ADDED_EVENT } from "@/lib/cart";

/**
 * Подтверждение «положили в корзину». На телефоне — сверху под шапкой,
 * чтобы не перекрывать липкую панель покупки внизу; на десктопе — справа внизу.
 */
export default function CartToast() {
  const [label, setLabel] = useState<string | null>(null);
  const [shownAt, setShownAt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onAdded(e: Event) {
      const detail = (e as CustomEvent<{ label: string }>).detail;
      setLabel(detail.label);
      setShownAt(Date.now());
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setLabel(null), 3200);
    }
    window.addEventListener(CART_ADDED_EVENT, onAdded);
    return () => {
      window.removeEventListener(CART_ADDED_EVENT, onAdded);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div aria-live="polite" className="fixed z-40 inset-x-3 top-[64px] sm:inset-x-auto sm:top-auto sm:bottom-6 sm:right-6 pointer-events-none">
      {label && (
        <div
          key={shownAt}
          className="cart-toast pointer-events-auto flex items-center gap-4 bg-text text-bg rounded-xl pl-4 pr-2 py-2 sm:max-w-sm shadow-[0_12px_40px_-12px_rgba(27,25,22,0.45)]"
        >
          <span className="w-2 h-2 rounded-full bg-amber shrink-0" aria-hidden="true" />
          <span className="flex flex-col min-w-0 flex-1">
            <span className="label-mono text-bg/60">В корзине</span>
            <span className="text-[14px] truncate">{label}</span>
          </span>
          <Link href="/cart" className="shrink-0 min-h-[40px] px-3 inline-flex items-center rounded-lg text-[14px] font-medium hover:bg-bg/10 transition-colors">
            Оформить →
          </Link>
        </div>
      )}
    </div>
  );
}
