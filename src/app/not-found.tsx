import Link from "next/link";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center flex flex-col items-center gap-3">
      <h1 className="display-2">{t.common.notFound}</h1>
      <p className="text-text-dim">{t.common.notFoundHint}</p>
      <Link href="/" className="mt-2 px-5 py-2.5 rounded-lg btn btn-primary font-semibold">
        {t.common.goHome}
      </Link>
    </div>
  );
}
