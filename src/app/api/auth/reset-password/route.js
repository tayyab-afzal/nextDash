import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

const bodySchema = z.object({
  email: z.email(),
  token: z.string().min(16),
  password: z.string().min(8),
});

export async function POST(req) {
  try {
    console.log("Reset Password API called");
    const { email, token, password } = bodySchema.parse(await req.json());
    const lower = email.toLowerCase();
    const db = await getDb();
    const users = db.collection("users");
    const resets = db.collection("passwordResetTokens");

    const record = await resets.findOne({ email: lower });
    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }
    const ok = await bcrypt.compare(token, record.tokenHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await users.updateOne({ email: lower }, { $set: { passwordHash, updatedAt: new Date() } });
    await resets.deleteOne({ _id: record._id });

    console.log("[/api/auth/reset-password] password updated for", lower);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/auth/reset-password] error", e);
    return NextResponse.json({ error: e.message || "Invalid request" }, { status: 400 });
  }
}


