import type { VisualVariant } from '@/services/public-content';
import { cn } from '@/utils/cn';

type BrandVisualProps = {
  variant: VisualVariant;
  label: string;
  className?: string;
};

function ArchArtwork() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(155deg,#26254B_0%,#424273_58%,#1B1A38_100%)]">
      <div className="absolute inset-x-[17%] top-[16%] bottom-[-22%] rounded-t-full border border-brand-gold/55 bg-[radial-gradient(circle_at_50%_55%,rgba(7,124,179,0.48),transparent_62%)]" />
      <div className="absolute inset-x-[27%] top-[27%] bottom-[-10%] rounded-t-full border border-brand-ivory/15" />
      <div className="absolute top-[40%] left-1/2 size-[44%] -translate-x-1/2 rounded-full border border-brand-gold/30" />
      <div className="absolute top-[48%] left-1/2 size-[24%] -translate-x-1/2 rounded-full border border-brand-ivory/20" />
      <div className="absolute top-[10%] left-1/2 h-[24%] w-px -translate-x-1/2 bg-linear-to-b from-transparent via-brand-gold/70 to-transparent" />
      <div className="absolute top-[22%] left-1/2 size-2 -translate-x-1/2 rotate-45 border border-brand-gold/70" />
    </div>
  );
}

function OrbitArtwork() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(145deg,#1B1A38_0%,#26254B_48%,#05618F_145%)]">
      <div className="absolute -top-[20%] -right-[18%] size-[78%] rounded-full bg-brand-azure/20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 size-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold/55" />
      <div className="absolute top-1/2 left-1/2 size-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-ivory/20" />
      <div className="absolute top-1/2 left-1/2 size-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-gold/35 bg-brand-indigo/55" />
      <div className="absolute top-[18%] left-[30%] size-1.5 rotate-45 bg-brand-gold" />
      <div className="absolute right-[19%] bottom-[28%] size-1 rotate-45 bg-brand-ivory/70" />
      <div className="absolute top-1/2 left-1/2 h-px w-[32%] -translate-x-1/2 bg-linear-to-r from-transparent via-brand-gold/80 to-transparent" />
    </div>
  );
}

function DrapeArtwork() {
  return (
    <div className="absolute inset-0 bg-brand-porcelain">
      <div
        className="absolute inset-0 bg-[linear-gradient(125deg,#424273_0%,#26254B_58%,#1B1A38_100%)]"
        style={{ clipPath: 'polygon(0 0, 100% 20%, 100% 100%, 0 80%)' }}
      />
      <div
        className="absolute inset-0 border border-brand-gold/70"
        style={{ clipPath: 'polygon(8% 12%, 92% 26%, 92% 88%, 8% 74%)' }}
      />
      <div className="absolute top-[40%] left-[12%] h-px w-[58%] -rotate-[7deg] bg-brand-gold/60" />
      <div className="absolute top-[48%] right-[16%] h-[18%] w-[22%] border border-brand-ivory/20" />
    </div>
  );
}

function HorizonArtwork() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#D8EEF8_0%,#7FC5E4_38%,#05618F_100%)]">
      <div className="absolute top-[24%] left-1/2 size-[36%] -translate-x-1/2 rounded-full border border-brand-ivory/50 bg-brand-porcelain/30" />
      <div className="absolute top-[53%] right-0 left-0 h-px bg-brand-gold/80" />
      <div className="absolute right-[12%] bottom-[18%] left-[12%] h-[17%] border-t border-brand-ivory/30 bg-brand-indigo-deep/55" />
      <div className="absolute bottom-[22%] left-[20%] h-[28%] w-px bg-linear-to-t from-transparent via-brand-ivory/60 to-transparent" />
    </div>
  );
}

function BloomArtwork() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,#26254B_0%,#424273_64%,#05618F_130%)]">
      <div className="absolute -top-[25%] -left-[18%] size-[80%] rounded-full border border-brand-azure/40 bg-brand-azure/15" />
      <div className="absolute top-[20%] -right-[18%] size-[70%] rounded-full border border-brand-ivory/15 bg-brand-azure/10" />
      <div className="absolute bottom-[-32%] left-[20%] size-[85%] rounded-full border border-brand-gold/35 bg-brand-indigo/50" />
      <div className="absolute top-1/2 left-1/2 h-[38%] w-px -translate-x-1/2 -translate-y-1/2 bg-linear-to-b from-transparent via-brand-gold/70 to-transparent" />
      <div className="absolute top-[34%] left-[48%] size-2 rotate-45 border border-brand-gold/80" />
    </div>
  );
}

function ColumnArtwork() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(135deg,#FCFAF6_0%,#EFE9DE_100%)]">
      <div className="absolute inset-x-[15%] top-[14%] bottom-[-12%] rounded-t-full border border-brand-indigo/40" />
      <div className="absolute inset-x-[29%] top-[28%] bottom-[-5%] rounded-t-full border border-brand-gold/65 bg-brand-indigo/5" />
      <div className="absolute top-1/2 left-1/2 h-px w-[46%] -translate-x-1/2 bg-brand-gold/75" />
      <div className="absolute top-[22%] left-1/2 size-1.5 -translate-x-1/2 rotate-45 bg-brand-indigo/70" />
      <div className="absolute bottom-[16%] left-[18%] h-[12%] w-px bg-brand-indigo/25" />
    </div>
  );
}

const artworkByVariant = {
  arch: ArchArtwork,
  orbit: OrbitArtwork,
  drape: DrapeArtwork,
  horizon: HorizonArtwork,
  bloom: BloomArtwork,
  column: ColumnArtwork,
};

export function BrandVisual({ variant, label, className }: BrandVisualProps) {
  const Artwork = artworkByVariant[variant];

  return (
    <div
      className={cn('relative isolate overflow-hidden bg-brand-indigo-deep', className)}
      role="img"
      aria-label={`${label}. Placeholder image.`}
    >
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.025]">
        <Artwork />
      </div>

      <span className="absolute top-4 left-1/2 z-10 -translate-x-1/2 border border-brand-ivory/25 bg-brand-indigo-deep/55 px-2 py-1 text-center text-[0.5rem] font-medium whitespace-nowrap tracking-[0.16em] text-brand-ivory/85 uppercase backdrop-blur">
        Image placeholder
      </span>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-brand-indigo-deep/90 via-brand-indigo-deep/45 to-transparent px-4 pt-14 pb-4">
        <span className="line-clamp-2 text-[0.625rem] tracking-[0.14em] text-brand-ivory/80 uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}
