import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { z } from "zod";
import speakeasy from "speakeasy";
import crypto from "crypto";
import { ObjectId } from "mongodb";

const bodySchema = z.object({ token: z.string().min(6).max(8) });
const ENC_KEY = process.env.MFA_ENCRYPTION_KEY;

function encrypt(text) {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENC_KEY), iv);
	const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, enc]).toString("base64");
}

export async function POST(req) {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { token } = bodySchema.parse(await req.json());

	const db = await getDb();
	const temp = await db.collection("mfaTemp").findOne({ userId: session.user.id });
	if (!temp) return NextResponse.json({ error: "No MFA in progress" }, { status: 400 });

	const ok = speakeasy.totp.verify({
		secret: temp.secretBase32,
		encoding: "base32",
		token,
		window: 1,
	});
	if (!ok) return NextResponse.json({ error: "Invalid token" }, { status: 400 });

	await db.collection("users").updateOne(
		{ _id: new ObjectId(session.user.id) },
		{
			$set: {
				mfaEnabled: true,
				mfaSecretEnc: encrypt(temp.secretBase32),
				updatedAt: new Date(),
			},
		},
	);
	await db.collection("mfaTemp").deleteOne({ userId: session.user.id });

	return NextResponse.json({ ok: true });
}