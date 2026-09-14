"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/track";

/**
 * Просмотры страниц и выбор цели.
 *
 * Цель («Плохо сплю») — это ссылка на /catalog?goal=sleep, поэтому её выбор
 * ловим здесь по параметру, а не вешаем обработчик на каждую плитку.
 * Админку не считаем — это не поведение покупателя.
 */
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const goal = searchParams.get("goal");
  const category = searchParams.get("category");

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    track("page_view", pathname === "/catalog" && (goal || category) ? `${goal ? "goal:" + goal : "category:" + category}` : undefined);
    if (goal) track("goal_select", goal);
  }, [pathname, goal, category]);

  return null;
}
