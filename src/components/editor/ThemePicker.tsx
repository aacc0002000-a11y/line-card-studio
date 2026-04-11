"use client";

import { cardThemes } from "@/lib/card/themes";
import type { CardThemeKey } from "@/lib/card/types";

export function ThemePicker({
  value,
  onChange,
}: {
  value: CardThemeKey;
  onChange: (value: CardThemeKey) => void;
}) {
  return (
    <section className="rounded-[28px] border border-line bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">色系選擇</h2>
        <p className="mt-1 text-sm text-muted">切換主色與背景，預覽會即時更新。</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cardThemes.map((theme) => {
          const isActive = theme.key === value;

          return (
            <button
              key={theme.key}
              type="button"
              onClick={() => onChange(theme.key)}
              className="rounded-3xl border p-3 text-left"
              style={{
                borderColor: isActive ? theme.primary : "var(--color-line)",
                backgroundColor: theme.surface,
                boxShadow: isActive
                  ? `0 14px 32px ${theme.primary}25`
                  : "0 8px 20px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div className="flex gap-2">
                <span
                  className="h-8 flex-1 rounded-2xl"
                  style={{ backgroundColor: theme.primary }}
                />
                <span
                  className="h-8 flex-1 rounded-2xl border"
                  style={{
                    backgroundColor: theme.secondary,
                    borderColor: theme.border,
                  }}
                />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">{theme.name}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
