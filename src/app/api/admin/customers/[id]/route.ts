import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authConfig from "@/auth-config";
import db from "@/lib/mongoose";
import Customer from "@/models/Customer";
import { CustomerUpdateZ } from "@/schemas/customer";

function deny() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authConfig);
  // @ts-ignore
  if (!session?.user || session.user.role !== "admin") return deny();
  await db;
  const item = await Customer.findById(params.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authConfig);
  // @ts-ignore
  if (!session?.user || session.user.role !== "admin") return deny();
  await db;
  const body = await req.json();
  const parsed = CustomerUpdateZ.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  const updated = await Customer.findByIdAndUpdate(params.id, parsed.data, {
    new: true,
  });
  if (!updated)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authConfig);
  // @ts-ignore
  if (!session?.user || session.user.role !== "admin") return deny();
  await db;
  await Customer.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
