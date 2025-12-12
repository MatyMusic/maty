// src/components/events/EventBookingFields.tsx

type Props = {
  initialFullName?: string;
  initialEmail?: string;
};

export function EventBookingFields({ initialFullName, initialEmail }: Props) {
  return (
    <section className="rounded-3xl border dark:border-neutral-800/70 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl p-5 text-right space-y-4">
      <h3 className="text-lg font-bold">פרטי אירוע ליצירת קשר</h3>

      <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm">
        <div className="space-y-1">
          <label className="block font-medium">שם מלא</label>
          <input
            name="fullName"
            required
            defaultValue={initialFullName}
            className="w-full rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
          />
        </div>

        <div className="space-y-1">
          <label className="block font-medium">טלפון נייד</label>
          <input
            name="phone"
            required
            className="w-full rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
          />
        </div>

        <div className="space-y-1">
          <label className="block font-medium">אימייל</label>
          <input
            type="email"
            name="email"
            defaultValue={initialEmail}
            className="w-full rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
          />
        </div>

        <div className="space-y-1">
          <label className="block font-medium">תאריך משוער</label>
          <input
            type="date"
            name="eventDate"
            className="w-full rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
          />
        </div>

        <div className="space-y-1">
          <label className="block font-medium">סוג אירוע</label>
          <select
            name="eventType"
            className="w-full rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
          >
            <option value="">בחר...</option>
            <option value="wedding">חתונה / חופה</option>
            <option value="bar-mitzvah">בר מצווה</option>
            <option value="farbrengen">התוועדות</option>
            <option value="community">אירוע קהילתי</option>
            <option value="concert">קונצרט / מופע</option>
          </select>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="block font-medium">
            הערות מיוחדות / מה חשוב לך באירוע
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
          />
        </div>
      </div>
    </section>
  );
}
