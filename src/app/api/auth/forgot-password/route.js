import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const bodySchema = z.object({ email: z.string().email() });

function getBaseUrl() {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function POST(req) {
  try {
    console.log("[/api/auth/forgot-password] POST called");
    const { email } = bodySchema.parse(await req.json());
    const lower = email.toLowerCase();
    const db = await getDb();
    const users = db.collection("users");
    const user = await users.findOne({ email: lower });
    const resets = db.collection("passwordResetTokens");

   if (!user) {
      console.log("forgot-password - unknown email", lower);
      return NextResponse.json(
        { ok: false, error: "EMAIL_NOT_FOUND" },
        { status: 404 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 12);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await resets.updateOne(
      { email: lower },
      { $set: { email: lower, tokenHash, expiresAt } },
      { upsert: true }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const from = process.env.EMAIL_FROM || "tayyabafzal897@gmail.com";
    const resetUrl = `${getBaseUrl()}/forgot/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(lower)}`;
    await transporter.sendMail({
      to: lower,
      from,
      subject: "Reset your password",
      text: `Click the link to reset your password: ${resetUrl}`,
      html: `<p>Click the link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    console.log("[/api/auth/forgot-password] reset email sent to", lower);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/auth/forgot-password] error", e);
    return NextResponse.json({ error: e.message || "Invalid request" }, { status: 400 });
  }
}


