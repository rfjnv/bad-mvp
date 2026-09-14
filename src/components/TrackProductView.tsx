"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Карточка товара — серверный компонент, поэтому просмотр шлём отсюда */
export default function TrackProductView({ slug }: { slug: string }) {
  useEffect(() => {
    track("product_view", slug);
  }, [slug]);
  return null;
}
