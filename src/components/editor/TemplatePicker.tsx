"use client";

import { cardTemplates } from "@/lib/card/templates";
import type { CardTemplateKey } from "@/lib/card/types";

export function TemplatePicker({
  value,
  onChange,
  lockedKeys = [],
  upgradeHref = "/upgrade",
}: {
  value: CardTemplateKey;
  onChange: (value: CardTemplateKey) => void;
  lockedKeys?: CardTemplateKey[];
  upgradeHref?: string;
}) {
  return (
    <section className="rounded-[28px] border border-line bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">模板選擇</h2>
        <p className="mt-1 text-sm text-muted">先選版型，再調整欄位與色系。</p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {cardTemplates.map((template) => {
          const isActive = template.key === value;
          const isLocked = lockedKeys.includes(template.key);

          return (
            <button
              key={template.key}
              type="button"
              onClick={() => {
                if (!isLocked) {
                  onChange(template.key);
                }
              }}
              disabled={isLocked}
              className="rounded-3xl border px-4 py-4 text-left"
              style={{
                borderColor: isActive ? "var(--color-accent)" : "var(--color-line)",
                backgroundColor: isActive ? "var(--color-accent-soft)" : "#ffffff",
                boxShadow: isActive
                  ? "0 16px 36px rgba(15, 118, 110, 0.12)"
                  : "0 8px 24px rgba(15, 23, 42, 0.04)",
                opacity: isLocked ? 0.6 : 1,
              }}
            >
              <p className="text-xs font-semibold tracking-[0.18em] text-accent">
                {template.previewLabel}
              </p>
              <h3 className="mt-2 text-base font-semibold text-foreground">
                {template.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                {template.description}
              </p>
              {isLocked ? (
                <p className="mt-3 text-sm font-medium text-amber-700">
                  此模板需升級方案後使用，請前往 {upgradeHref} 查看方案。
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
