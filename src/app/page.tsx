import Image from "next/image";
import { CardActions } from "@/components/card-actions";
import { cardContent } from "@/data/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <section className="w-full max-w-md rounded-[32px] border border-line bg-card p-5 shadow-[0_24px_80px_rgba(23,32,51,0.08)] sm:p-7">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-line bg-slate-100">
            <Image
              src={cardContent.photoSrc}
              alt={cardContent.photoAlt}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-display text-xs font-semibold tracking-[0.28em] text-accent">
              {cardContent.brandEn}
            </p>
            <h1 className="text-balance text-2xl font-semibold text-foreground">
              {cardContent.heroTitle}
            </h1>
            <p className="text-sm text-muted">{cardContent.displayName}</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-[#f8fafc] p-4">
          <p className="text-sm leading-7 whitespace-pre-line text-foreground">
            {cardContent.intro}
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">我可以協助你</h2>
          <ul className="mt-3 space-y-3">
            {cardContent.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 rounded-2xl border border-line px-4 py-3 text-sm leading-6 text-muted"
              >
                <span className="mt-1 block h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <CardActions />
        </div>
      </section>
    </main>
  );
}
