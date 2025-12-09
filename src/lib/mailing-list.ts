export async function subscribeToMailingList(email: string, name?: string) {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const server = process.env.MAILCHIMP_SERVER_PREFIX;
  const listId = process.env.MAILCHIMP_LIST_ID;

  if (!email) return;
  if (!apiKey || !server || !listId) {
    console.log("[mailing-list] missing env, skip subscribe:", { email });
    return;
  }

  const body = {
    email_address: email,
    status_if_new: "subscribed",
    status: "subscribed",
    merge_fields: {
      FNAME: name?.split(" ")?.[0] || "",
      LNAME: name?.split(" ")?.slice(1)?.join(" ") || "",
      SOURCE: "site",
    },
  };

  const res = await fetch(
    `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members/${hashEmail(
      email
    )}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa("any:" + apiKey),
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.warn("[mailing-list] mailchimp error", res.status, err);
  }
}

function hashEmail(email: string) {
  // Mailchimp member id = MD5(lowercase(email))
  return md5(email.trim().toLowerCase());
}

// מינימום מימוש MD5 מקומי (כדי לא למשוך תלויות)
function md5(str: string) {
  // Simple JS md5 (לא קריטי לביצועים כאן); אם אתה מעדיף—הוסף ספרייה 'blueimp-md5'
  // להקטין: אפשר להזין מימוש MD5 קצר מוכן. כאן placeholder:
  // כדי לחסוך תלויות, ננסה קריאה ל-Subresource Crypto אם קיים:
  if (typeof window === "undefined") {
    const crypto = require("crypto");
    return crypto.createHash("md5").update(str).digest("hex");
  } else {
    // דפדפן: לא נשתמש; ממילא הפונקציה נקראת מהשרת.
    throw new Error("md5 should run on server");
  }
}
