// // src/components/media/MiniPlayer.tsx
// "use client";
// import * as React from "react";

// export default function MiniPlayer() {
//   const [url, setUrl] = React.useState<string | null>(null);
//   // נגן בסיסי: לא לזרוק שגיאה אם המשתמש עוזב/מחליף שיר
//   return (
//     <div className="flex items-center gap-3 rounded-2xl border p-3">
//       <button
//         onClick={() =>
//           setUrl(
//             "/api/proxy?u=https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
//           )
//         }
//         className="btn"
//       >
//         ▶️ נגן
//       </button>
//       {url && (
//         <audio
//           src={url}
//           controls
//           preload="none"
//           onError={() => {
//             // לא לרשום לשגיאות גלובליות—רק פידבק קטן אם תרצה
//             console.warn("Audio error (ignore if עברת דף)");
//           }}
//         />
//       )}
//     </div>
//   );
// }
