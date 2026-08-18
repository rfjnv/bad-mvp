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
        className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        priority
      />
      {/* Плотный градиент снизу: без него читаемость текста держится на удаче */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <div className="absolute left-5 right-5 bottom-5 sm:left-10 sm:bottom-10 flex flex-col items-start gap-2 sm:gap-3">
        <h2 className="text-white display-2 max-w-lg">{banner.title}</h2>
        {banner.subtitle && (
          <p className="text-white/85 text-sm sm:text-base max-w-md">{banner.subtitle}</p>
        )}
        {banner.linkUrl && (
          <span className="mt-1 inline-flex items-center min-h-[44px] px-5 rounded-lg bg-white text-text font-semibold text-sm border border-white transition-colors duration-150 group-hover:bg-transparent group-hover:text-white">
            Смотреть
          </span>
        )}
      </div>
    </>
  );
}

const CARD_CLASS =
  "relative shrink-0 w-[92%] sm:w-full snap-start rounded-3xl overflow-hidden bg-bg-panel aspect-[4/3] sm:aspect-[21/8] group";

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
