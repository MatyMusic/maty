"use client";
import { useEffect } from "react";

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return; // מושבת אם אין
    // @ts-ignore
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    // @ts-ignore
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({ appId, notifyButton: { enable: true } });
    });

    const s = document.createElement("script");
    s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    s.async = true;
    document.head.appendChild(s);
    return () => {
      try {
        document.head.removeChild(s);
      } catch {}
    };
  }, []);
  return null;
}
