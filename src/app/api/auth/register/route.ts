import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  await db.insert(users).values({ email, hashedPassword, name: email.split("@")[0] });
  return NextResponse.json({ success: true });
}
