// src/components/ContactDock.tsx
'use client';

import { CONTACT } from '@/lib/constants';

function IconWrap({
  title,
  href,
  children,
  newTab = false,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
  newTab?: boolean;
}) {
  return (
    <a
      href={href}
      title={title}
      aria-label={title}
      className="h-11 w-11 rounded-full bg-white/90 dark:bg-neutral-900/90 border border-black/10 dark:border-white/10 shadow backdrop-blur flex items-center justify-center hover:opacity-90 focus:outline-none focus:ring-2 ring-brand"
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

export default function ContactDock() {
  // במובייל: מוסתר. בדסקטופ: עמודה שמאלית באמצע המסך.
  // z-index נמוך מ-MATY-AI (שעל 4000), כך שלא יתנגש.
  return (
    <div className="hidden md:flex fixed left-3 top-1/2 -translate-y-1/2 z-[3800] flex-col items-center gap-2">
      {/* WhatsApp */}
      <IconWrap
        title="וואטסאפ"
        href={`https://wa.me/${CONTACT.phoneE164.replace('+', '')}`}
        newTab
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M12 2a10 10 0 0 0-8.94 14.56L2 22l5.6-1.47A10 10 0 1 0 12 2Zm0 2a8 8 0 0 1 6.86 12.18l-.23.34l.34 2l-1.97-.52l-.34.2A8 8 0 1 1 12 4Zm4.27 3.78c-.19-.44-.38-.45-.56-.45h-.48c-.17 0-.43.06-.66.32s-.86.85-.86 2.08s.88 2.41 1 .26c.11-.21.35-.6.35-.6s.06-.1.02-.17s-.14-.22-.29-.37s-.58-.57-.58-1.09s.37-.74.5-.84s.25-.12.34-.12h.24c.08 0 .18 0 .28.2s.36.45.36.57s-.06.29-.12.42s-.25.46-.25.46s-.05.07 0 .14s.08.14.16.23s.34.4.73.65s.85.4.99.45s.23.04.31-.06s.36-.42.46-.56s.19-.12.32-.07s.81.38.95.45s.24.11.28.17s.04.99-.48 1.93s-1.38 1.33-1.91 1.38s-1.05.05-1.73-.17s-1.5-.49-2.55-1.4s-2.1-2.1-2.41-3.63s.24-2.7.35-2.9s.26-.38.51-.58S9.4 7 9.62 7s.44.01.64.01s.49.08.77.6s.64 1.23.7 1.32s.11.21.06.34s-.1.22-.2.36s-.21.29-.3.41Z"
          />
        </svg>
      </IconWrap>

      {/* Email */}
      <IconWrap
        title="מייל"
        href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(
          CONTACT.emailSubject || '',
        )}&body=${CONTACT.emailBody || ''}`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2v.01L12 13L4 6.01V6h16ZM4 18V8l8 7l8-7v10H4Z"
          />
        </svg>
      </IconWrap>

      {/* Phone */}
      <IconWrap title="התקשר" href={`tel:${CONTACT.phoneE164}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 0 0-1 .24l-1.57 1.57a15.1 15.1 0 0 1-6.4-6.4L8 8.77a1 1 0 0 0 .25-1A11.5 11.5 0 0 1 7.7 4H4a1 1 0 0 0-1 1c0 9.39 7.61 17 17 17a1 1 0  0 0 1-1v-3.7a1 1 0 0 0-1-1Z"
          />
        </svg>
      </IconWrap>

      {/* VCF (כרטיס ביקור) */}
      <IconWrap title="הורד כרטיס ביקור" href={CONTACT.vcfPath}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M20 6H4v12h16V6Zm-2 10H6V8h12v8Zm-6-1c-1.66 0-3-1.34-3-3s1.34-3 3-3s3 1.34 3 3s-1.34 3-3 3Z"
          />
        </svg>
      </IconWrap>

      {/* קו דקורטיבי קטן */}
      <div className="h-8 w-px bg-black/10 dark:bg-white/10 my-1" aria-hidden />
    </div>
  );
}
