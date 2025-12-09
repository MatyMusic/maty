import "server-only";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { groupsCol } from "@/lib/music-groups/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth/config";
import { isSiteAdmin } from "@/lib/auth/guards";

export default async function GroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const col = await groupsCol();
  const item = await col.findOne({ _id: new ObjectId(params.id) });
  if (!item) notFound();

  const session = await getServerSession(authConfig);
  const uid = session?.user?.id || null;
  const email = (session?.user?.email || "").toLowerCase();

  const isOwner = uid && item.ownerId === uid;
  const isAdmin =
    isOwner ||
    (uid && (item.admins || []).includes(uid)) ||
    (await isSiteAdmin(email));

  return (
    <main dir="rtl" className="container mx-auto px-3 py-6">
      <h1 className="text-2xl font-bold">{item.title}</h1>
      {item.city ? <div className="opacity-80 mt-1">{item.city}</div> : null}
      <p className="mt-4 max-w-3xl">{item.description}</p>

      <div className="mt-4 text-sm flex flex-wrap gap-2">
        {(item.purposes || []).map((p: string) => (
          <span key={p} className="px-2 py-1 rounded-full border">
            {p}
          </span>
        ))}
        {(item.daws || []).map((d: string) => (
          <span key={d} className="px-2 py-1 rounded-full bg-muted">
            {d}
          </span>
        ))}
        {(item.skills || []).map((s: string) => (
          <span key={s} className="px-2 py-1 rounded-full border">
            {s}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <div className="opacity-70 text-sm">חברים: {item.membersCount}</div>
        <div className="opacity-70 text-sm">
          נראות: {item.visibility} | הצטרפות: {item.joinPolicy}
        </div>
      </div>

      {isAdmin ? (
        <section className="mt-8 border rounded-2xl p-4">
          <h2 className="font-semibold">ניהול קבוצה</h2>
          <ul className="text-sm list-disc ms-5 mt-2">
            <li>עריכת פרטי הקבוצה (שם/תיאור/תגים/עיר/מקום/לו״ז)</li>
            <li>ניהול מנהלים וחברים, הגבלות הצטרפות, תור דיווחים</li>
            <li>העלאת קבצים/לינקים לשיעורים (Cubase/Ableton וכו')</li>
            <li>לוח זמנים לחזרות + רשימות שירים</li>
          </ul>
        </section>
      ) : null}
    </main>
  );
}
