import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const bodySchema = z.object({ email: z.email() });

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// function getTransport() {
//   const host = process.env.EMAIL_SERVER_HOST;
//   const port = Number(process.env.EMAIL_SERVER_PORT || 587);
//   const user = process.env.EMAIL_SERVER_USER;
//   const pass = process.env.EMAIL_SERVER_PASSWORD;
//   if (!host || !user || !pass) throw new Error("Email server env vars missing");
//   return nodemailer.createTransport({ host, port, auth: { user, pass } });
// }

export async function POST(req) {
  try {
    console.log("[/api/auth/send-code] POST called");
    const { email } = bodySchema.parse(await req.json());
    const db = await getDb();
    const users = db.collection("users");
    const loginCodes = db.collection("emailLoginCodes");

    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("Invalid Email in Send Code API: ", email);
      return NextResponse.json({ ok: true });
    }

    const code = generateCode();
    const codeHash = await bcrypt.hash(code, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await loginCodes.updateOne(
      { email: email.toLowerCase() },
      { $set: { email: email.toLowerCase(), codeHash, expiresAt } },
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
    await transporter.sendMail({
      to: email,
      from,
      subject: "Your login code",
      text: `Your login code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your login code is <b>${code}</b>. It expires in 10 minutes.</p>`,
    });

    console.log("Code sent to email: ", email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error caught at send-code", e);
    return NextResponse.json({ error: e.message || "Invalid request" }, { status: 400 });
  }
}


