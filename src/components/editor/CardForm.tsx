"use client";

import type { ChangeEvent } from "react";
import type { CardProfileData } from "@/lib/card/types";

type CardFormProps = {
  value: CardProfileData;
  onChange: (value: CardProfileData) => void;
};

type TextFieldConfig = {
  key: keyof CardProfileData;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "url" | "tel";
};

const basicFields: TextFieldConfig[] = [
  { key: "displayName", label: "姓名", placeholder: "王大明" },
  { key: "englishName", label: "英文名", placeholder: "Kobe Wang" },
  { key: "jobTitle", label: "職稱", placeholder: "品牌設計師 / 視覺顧問" },
  { key: "companyName", label: "公司名稱", placeholder: "王室設計公司" },
  { key: "address", label: "地址", placeholder: "台北市大安區..." },
  { key: "email", label: "Email", type: "email", placeholder: "hello@example.com" },
  { key: "phone", label: "電話", type: "tel", placeholder: "0912-345-678" },
  { key: "lineUrl", label: "LINE 連結", type: "url", placeholder: "https://line.me/..." },
  { key: "websiteUrl", label: "網站連結", type: "url", placeholder: "https://example.com" },
  { key: "primaryButtonLabel", label: "按鈕 1 文字", placeholder: "預約諮詢" },
  {
    key: "primaryButtonUrl",
    label: "按鈕 1 連結",
    type: "url",
    placeholder: "https://example.com/book",
  },
  { key: "secondaryButtonLabel", label: "按鈕 2 文字", placeholder: "作品集" },
  {
    key: "secondaryButtonUrl",
    label: "按鈕 2 連結",
    type: "url",
    placeholder: "https://example.com/portfolio",
  },
];

export function CardForm({ value, onChange }: CardFormProps) {
  const updateField =
    (key: keyof CardProfileData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({
        ...value,
        [key]: event.target.value,
      });
    };

  return (
    <section className="rounded-[28px] border border-line bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">內容編輯</h2>
        <p className="mt-1 text-sm text-muted">欄位更新後，右側預覽會即時同步。</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {basicFields.map((field) => (
          <Field
            key={field.key}
            label={field.label}
            type={field.type || "text"}
            value={value[field.key]}
            placeholder={field.placeholder}
            onChange={updateField(field.key)}
          />
        ))}
      </div>

      <div className="mt-4">
        <label className="block">
          <span className="text-sm font-medium text-foreground">簡介</span>
          <textarea
            value={value.bio}
            onChange={updateField("bio")}
            rows={5}
            placeholder="介紹你的專業、服務內容與合作風格。"
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-6 text-foreground outline-none focus:border-accent"
          />
        </label>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type: "text" | "email" | "url" | "tel";
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
      />
    </label>
  );
}
