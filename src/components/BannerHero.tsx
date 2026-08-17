import Link from "next/link";
import Image from "next/image";

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
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute left-5 right-5 bottom-5 sm:left-10 sm:bottom-10 flex flex-col gap-1">
        <h2 className="text-white text-xl sm:text-3xl font-semibold tracking-tight drop-shadow-sm">
          {banner.title}
        </h2>
        {banner.subtitle && (
          <p className="text-white/85 text-sm sm:text-base max-w-md">{banner.subtitle}</p>
        )}
      </div>
    </>
  );
}

const CARD_CLASS =
  "relative shrink-0 w-[86%] sm:w-full snap-start rounded-3xl overflow-hidden bg-bg-panel aspect-[16/9] sm:aspect-[21/8] group";

export default function BannerHero({ banners }: { banners: BannerData[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
    </div>
  );
}
