/* eslint-disable @next/next/no-img-element */

import { getImagePreviewSrc } from "@/lib/card/image";

export function CardImage({
  src,
  alt,
  className,
  fallbackLabel,
}: {
  src: string;
  alt: string;
  className: string;
  fallbackLabel: string;
}) {
  const previewSrc = getImagePreviewSrc(src);

  if (!previewSrc) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-[#f4f7fb] text-center text-xs font-semibold tracking-[0.16em] text-muted`}
      >
        {fallbackLabel}
      </div>
    );
  }

  return <img src={previewSrc} alt={alt} className={className} />;
}
