// src/components/common/SafeImage.tsx
"use client";
import * as React from "react";

const FALLBACK_DATA_URI =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="100%" height="100%" fill="%23ddd"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23666">no image</text></svg>';

export default function SafeImage({
  src,
  alt = "",
  className = "",
  fallback = FALLBACK_DATA_URI,
}: {
  src?: string;
  alt?: string;
  className?: string;
  fallback?: string;
}) {
  const [okSrc, setOkSrc] = React.useState(src || fallback);
  React.useEffect(() => setOkSrc(src || fallback), [src, fallback]);
  return (
    <img
      src={okSrc}
      alt={alt}
      className={className}
      onError={() => setOkSrc(fallback)}
      loading="lazy"
    />
  );
}
