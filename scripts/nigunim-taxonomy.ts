// scripts/nigunim-taxonomy.ts (לא חובה – לסדר אחיד של קטגוריות)
export const TAXONOMY = {
  chabad: {
    label: 'חב"ד',
    sub: {
      farbrengen: "התוועדות",
      simchatTorah: "שמחת תורה",
      niggunHachnosasOrchim: "הכנסת אורחים",
      rikud: "ריקוד",
      dveikus: "דביקות/עמוק",
    },
  },
  hassidic: {
    label: "חסידי כללי",
    sub: {
      weddingDance: "ריקוד חתונה",
      badeken: "בדקֶן",
      tish: "טיש",
      kapelye: "ניגוני כלייזמר",
    },
  },
  jewish: {
    label: "דתי/מסורתי",
    sub: {
      zemirot: "זמירות שבת",
      tefila: "תפילה/פיוט",
      yomTov: "חגים ומועדים",
    },
  },
  kids: { label: "ילדים", sub: {} },
  slow: { label: "שקט/נשמה", sub: {} },
  dance: { label: "ריקוד/קצבי", sub: {} },
};
