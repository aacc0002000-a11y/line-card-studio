import { CardImage } from "@/components/card/CardImage";
import type { CardTemplateComponentProps } from "@/lib/card/types";

export function HeroSplitCard({ data, theme }: CardTemplateComponentProps) {
  return (
    <article
      className="overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
        <div
          className="relative overflow-hidden p-6"
          style={{
            background: `linear-gradient(150deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
          }}
        >
          <div className="absolute inset-0 opacity-15">
            <div className="absolute -right-10 top-6 h-28 w-28 rounded-full border border-white/50" />
            <div className="absolute left-6 top-20 h-44 w-44 rounded-full border border-white/30" />
          </div>
          <div className="relative z-10">
            <CardImage
              src={data.logoUrl}
              alt={`${data.companyName} logo`}
              className="h-14 w-14 rounded-2xl bg-white/90 p-2 object-contain"
              fallbackLabel="LOGO"
            />
            <p className="mt-6 text-xs font-semibold tracking-[0.24em] text-white/75">
              {data.companyName}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {data.displayName}
            </h2>
            <p className="mt-2 text-sm text-white/85">{data.englishName}</p>
            <p className="mt-3 text-sm leading-7 text-white/92">{data.jobTitle}</p>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/82">
              {data.bio}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="overflow-hidden rounded-[24px] border border-black/5">
            <CardImage
              src={data.avatarUrl}
              alt={`${data.displayName} avatar`}
              className="h-52 w-full object-cover"
              fallbackLabel="AVATAR"
            />
          </div>

          <div className="grid gap-3">
            <MetaCard label="Email" value={data.email} tone={theme.primary} />
            <MetaCard label="Phone" value={data.phone} tone={theme.primary} />
            <MetaCard label="Address" value={data.address} tone={theme.primary} />
            <MetaCard
              label="Website"
              value={data.websiteUrl.replace(/^https?:\/\//, "")}
              tone={theme.primary}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ActionSurface
              label={data.primaryButtonLabel}
              backgroundColor={theme.primary}
              textColor={theme.buttonText}
            />
            <ActionSurface
              label={data.secondaryButtonLabel}
              backgroundColor={theme.secondary}
              textColor={theme.text}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function MetaCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em]" style={{ color: tone }}>
        {label}
      </p>
      <p className="mt-1 text-sm leading-6">{value}</p>
    </div>
  );
}

function ActionSurface({
  label,
  backgroundColor,
  textColor,
}: {
  label: string;
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 text-center text-sm font-semibold shadow-sm"
      style={{ backgroundColor, color: textColor }}
    >
      {label}
    </div>
  );
}
