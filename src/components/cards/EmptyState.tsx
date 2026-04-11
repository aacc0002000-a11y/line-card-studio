import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <section className="rounded-[32px] border border-dashed border-line bg-card px-6 py-10 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted sm:text-base">
        {description}
      </p>
      <Link
        href={actionHref}
        className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
      >
        {actionLabel}
      </Link>
    </section>
  );
}
