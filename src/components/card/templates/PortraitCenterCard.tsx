import { CardImage } from "@/components/card/CardImage";
import type { CardTemplateComponentProps } from "@/lib/card/types";

export function PortraitCenterCard({
  data,
  theme,
}: CardTemplateComponentProps) {
  return (
    <article
      className="overflow-hidden rounded-[28px] border shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <div
        className="h-28 w-full"
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
        }}
      />
      <div className="px-6 pb-6">
        <div className="-mt-14 flex flex-col items-center text-center">
          <div
            className="overflow-hidden rounded-[24px] border-4 shadow-lg"
            style={{ borderColor: theme.surface }}
          >
            <CardImage
              src={data.avatarUrl}
              alt={`${data.displayName} avatar`}
              className="h-40 w-[7.5rem] bg-white object-cover"
              fallbackLabel="AVATAR"
            />
          </div>
          <p
            className="mt-4 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.22em]"
            style={{
              backgroundColor: theme.secondary,
              color: theme.primary,
            }}
          >
            {data.companyName}
          </p>
          <h2 className="mt-4 text-3xl font-semibold">{data.displayName}</h2>
          <p className="mt-1 text-sm font-medium" style={{ color: theme.primary }}>
            {data.englishName}
          </p>
          <p className="mt-2 text-sm">{data.jobTitle}</p>
          <p
            className="mt-4 rounded-2xl px-4 py-4 text-sm leading-6"
            style={{ backgroundColor: theme.secondary, color: theme.text }}
          >
            {data.bio}
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <InfoBlock label="Email" value={data.email} themeColor={theme.primary} />
          <InfoBlock label="Phone" value={data.phone} themeColor={theme.primary} />
          <InfoBlock label="Address" value={data.address} themeColor={theme.primary} />
          <InfoBlock
            label="Website"
            value={stripProtocol(data.websiteUrl)}
            themeColor={theme.primary}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ActionButton
            label={data.primaryButtonLabel}
            backgroundColor={theme.primary}
            textColor={theme.buttonText}
          />
          <ActionButton
            label={data.secondaryButtonLabel}
            backgroundColor={theme.secondary}
            textColor={theme.text}
          />
        </div>
      </div>
    </article>
  );
}

function InfoBlock({
  label,
  value,
  themeColor,
}: {
  label: string;
  value: string;
  themeColor: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-black/5 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.18em]" style={{ color: themeColor }}>
        {label}
      </p>
      <p className="mt-1 text-sm leading-6">{value}</p>
    </div>
  );
}

function ActionButton({
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

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "");
}
