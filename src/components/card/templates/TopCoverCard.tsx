import { CardImage } from "@/components/card/CardImage";
import type { CardTemplateComponentProps } from "@/lib/card/types";

export function TopCoverCard({ data, theme }: CardTemplateComponentProps) {
  return (
    <article
      className="overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <div className="relative h-48">
        <CardImage
          src={data.coverUrl}
          alt={`${data.displayName} cover`}
          className="h-full w-full object-cover"
          fallbackLabel="COVER IMAGE"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.72) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-white/75">
              {data.companyName}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              {data.displayName}
            </h2>
            <p className="mt-1 text-sm text-white/80">{data.jobTitle}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur">
            <CardImage
              src={data.logoUrl}
              alt={`${data.companyName} logo`}
              className="h-[3.25rem] w-[3.25rem] object-contain"
              fallbackLabel="LOGO"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div
          className="rounded-3xl p-4"
          style={{ backgroundColor: theme.secondary }}
        >
          <p className="text-sm leading-7">{data.bio}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailPill label="English Name" value={data.englishName} />
          <DetailPill label="Email" value={data.email} />
          <DetailPill label="Phone" value={data.phone} />
          <DetailPill label="Address" value={data.address} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ActionBox
            label={data.primaryButtonLabel}
            accent={theme.primary}
            text={theme.buttonText}
          />
          <ActionBox
            label={data.secondaryButtonLabel}
            accent={theme.secondary}
            text={theme.text}
          />
        </div>
      </div>
    </article>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-black/45">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6">{value}</p>
    </div>
  );
}

function ActionBox({
  label,
  accent,
  text,
}: {
  label: string;
  accent: string;
  text: string;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 text-center text-sm font-semibold shadow-sm"
      style={{ backgroundColor: accent, color: text }}
    >
      {label}
    </div>
  );
}
