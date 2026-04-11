import { CardImage } from "@/components/card/CardImage";
import type { CardTemplateComponentProps } from "@/lib/card/types";

export function TopLeftAvatarCard({
  data,
  theme,
}: CardTemplateComponentProps) {
  return (
    <article
      className="overflow-hidden rounded-[28px] border p-5 shadow-[0_24px_60px_rgba(15,23,42,0.14)]"
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      <div
        className="rounded-[24px] p-5"
        style={{
          background: `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.background} 100%)`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="overflow-hidden rounded-[22px] border bg-white shadow-md"
            style={{ borderColor: theme.border }}
          >
            <CardImage
              src={data.avatarUrl}
              alt={`${data.displayName} avatar`}
              className="h-[7.5rem] w-24 object-cover"
              fallbackLabel="AVATAR"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className="text-xs font-semibold tracking-[0.2em]"
                  style={{ color: theme.primary }}
                >
                  {data.companyName}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{data.displayName}</h2>
                <p className="mt-1 text-sm" style={{ color: theme.mutedText }}>
                  {data.englishName}
                </p>
              </div>
              <CardImage
                src={data.logoUrl}
                alt={`${data.companyName} logo`}
                className="h-11 w-11 rounded-2xl bg-white/80 p-2 object-contain"
                fallbackLabel="LOGO"
              />
            </div>
            <p className="mt-3 text-sm leading-6">{data.jobTitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_0.95fr]">
        <div
          className="rounded-3xl px-4 py-4 text-sm leading-7"
          style={{ backgroundColor: theme.background, color: theme.text }}
        >
          {data.bio}
        </div>
        <div className="space-y-3">
          <ContactLine label="Email" value={data.email} />
          <ContactLine label="Phone" value={data.phone} />
          <ContactLine label="Address" value={data.address} />
          <ContactLine
            label="Website"
            value={data.websiteUrl.replace(/^https?:\/\//, "")}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ActionPanel
          label={data.primaryButtonLabel}
          backgroundColor={theme.primary}
          textColor={theme.buttonText}
        />
        <ActionPanel
          label={data.secondaryButtonLabel}
          backgroundColor={theme.secondary}
          textColor={theme.text}
        />
      </div>
    </article>
  );
}

function ContactLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/5 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-black/45">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6">{value}</p>
    </div>
  );
}

function ActionPanel({
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
