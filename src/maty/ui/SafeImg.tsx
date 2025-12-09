// src/components/ui/SafeImg.tsx
export default function SafeImg(
  props: React.ImgHTMLAttributes<HTMLImageElement>,
) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      onError={(e) => {
        const el = e.currentTarget;
        if (el.dataset.fallbackApplied) return;
        el.dataset.fallbackApplied = "1";
        el.src = "/assets/images/fit/exercise-placeholder.jpg";
      }}
      loading="lazy"
      decoding="async"
      alt={props.alt || "image"}
    />
  );
}
