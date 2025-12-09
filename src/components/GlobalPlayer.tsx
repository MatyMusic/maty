// // src/components/GlobalPlayer.tsx
// "use client";

// import { usePathname } from "next/navigation";
// import dynamic from "next/dynamic";

// // טוענים את הנגן בדינמיות בלי SSR כדי למנוע הבדלי SSR/CSR
// const ProPlayer = dynamic(() => import("./ProPlayer"), { ssr: false });

// // ראוטים שבהם לא נציג את הנגן (תעדכן לפי הצורך)
// const HIDE_ON = [
//   /^\/auth(\/|$)/,       // /auth...
//   /^\/checkout(\/|$)/,   // /checkout...
//   /^\/dashboard(\/|$)/,  // /dashboard...
//   /^\/api(\/|$)/,        // ליתר בטחון
// ];

// export default function GlobalPlayer() {
//   const pathname = usePathname() || "/";
//   const hide = HIDE_ON.some((re) => re.test(pathname));
//   if (hide) return null;
//   return <ProPlayer />;
// }

// src/components/GlobalPlayer.tsx
"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// טוענים את הנגן בדינמיות כדי למנוע הבדלי SSR/CSR
const ProPlayer = dynamic(() => import("./ProPlayer"), { ssr: false });

// מציגים תמיד (לא מסתירים בשום ראוט)
const HIDE_ON: RegExp[] = []; // השאר ריק = תמיד מוצג

export default function GlobalPlayer() {
  const pathname = usePathname() || "/";
  const hide = HIDE_ON.some((re) => re.test(pathname)); // תמיד false
  if (hide) return null;
  return <ProPlayer />;
}
