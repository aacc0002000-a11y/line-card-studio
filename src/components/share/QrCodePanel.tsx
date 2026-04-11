"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { generateQrCodeDataUrl } from "@/lib/share/qrcode";

export function QrCodePanel({ url }: { url: string }) {
  const [qrCodeSrc, setQrCodeSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadQrCode = async () => {
      try {
        setError(null);
        const nextSrc = await generateQrCodeDataUrl(url);

        if (!cancelled) {
          setQrCodeSrc(nextSrc);
        }
      } catch {
        if (!cancelled) {
          setError("QR Code 產生失敗，請改用複製連結。");
        }
      }
    };

    void loadQrCode();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <section className="rounded-[28px] border border-line bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">QR Code</h2>
      <p className="mt-2 text-sm leading-6 text-muted">掃描查看電子名片，也可直接分享給他人。</p>
      <div className="mt-4 flex min-h-[244px] items-center justify-center rounded-[24px] bg-[#f8fafc] p-4">
        {qrCodeSrc ? (
          <Image src={qrCodeSrc} alt="QR Code for public card" width={220} height={220} className="rounded-2xl" />
        ) : (
          <p className="text-sm text-muted">{error || "正在產生 QR Code..."}</p>
        )}
      </div>
      <p className="mt-3 break-all text-xs leading-6 text-muted">{url}</p>
    </section>
  );
}
