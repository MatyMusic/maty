// // src/app/api/debug/whoami/route.ts
// import { NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import authConfig from "@/auth-config";
// import { getDb } from "@/lib/mongo";

// export async function GET() {
//   try {
//     const session = await getServerSession(authConfig);
//     const db = await getDb();
//     const userByEmail = session?.user?.email
//       ? await db
//           .collection("users")
//           .findOne(
//             { email: session.user.email.toLowerCase() },
//             {
//               projection: {
//                 _id: 1,
//                 email: 1,
//                 name: 1,
//                 role: 1,
//                 image: 1,
//                 createdAt: 1,
//               },
//             }
//           )
//       : null;

//     return NextResponse.json({
//       ok: true,
//       env: {
//         hasMongoUri: Boolean(process.env.MONGODB_URI),
//         dbName: process.env.MONGODB_DB || "(default in URI)",
//       },
//       session,
//       dbUser: userByEmail,
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       { ok: false, error: String(e?.message || e) },
//       { status: 500 }
//     );
//   }
// }



export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";

export async function GET() {
  const session = await getServerSession(authConfig);
  return NextResponse.json({
    email: session?.user?.email || null,
    role: (session as any)?.role || null,
  });
}

