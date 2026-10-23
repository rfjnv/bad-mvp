import Link from "next/link";
import Image from "next/image";
import ScrollCarousel from "@/components/ScrollCarousel";

export interface BannerData {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
}

function BannerContent({ banner }: { banner: BannerData }) {
  return (
    <>
      <Image
        src={banner.imageUrl}
        alt={banner.title}
        fill
        sizes="(max-width: 640px) 86vw, 1152px"
        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
      />
      {/* Скрим только под текстом: без него читаемость держится на удаче */}
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
      <div className="absolute left-5 right-5 bottom-5 sm:left-8 sm:bottom-8 flex flex-col items-start gap-2">
        <span className="label-mono text-white/75">Сейчас в магазине</span>
        <h2 className="text-white display-2 max-w-lg">{banner.title}</h2>
        {banner.subtitle && <p className="text-white/80 text-sm sm:text-[15px] max-w-md">{banner.subtitle}</p>}
        {banner.linkUrl && (
          <span className="mt-1 text-white text-[15px] font-medium underline underline-offset-[6px] decoration-white/40 group-hover:decoration-white transition-colors duration-300">
            Смотреть →
          </span>
        )}
      </div>
    </>
  );
}

const CARD_CLASS =
  "relative shrink-0 w-[88%] sm:w-full snap-start rounded-3xl overflow-hidden bg-bg-panel aspect-[4/3] sm:aspect-[21/9] group";

export default function BannerHero({ banners }: { banners: BannerData[] }) {
  if (banners.length === 0) return null;

  return (
    <ScrollCarousel
      count={banners.length}
      trackClassName="pb-1 -mx-4 px-4 sm:mx-0 sm:px-0"
      dotsClassName="sm:hidden"
    >
      {banners.map((b) =>
        b.linkUrl ? (
          <Link key={b.id} href={b.linkUrl} className={CARD_CLASS}>
            <BannerContent banner={b} />
          </Link>
        ) : (
          <div key={b.id} className={CARD_CLASS}>
            <BannerContent banner={b} />
          </div>
        )
      )}
    </ScrollCarousel>
  );
}
