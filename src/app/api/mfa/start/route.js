import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function POST() {
	const session = await auth();
	if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const secret = speakeasy.generateSecret({
		name: `MyApp (${session.user.email})`,
		length: 20,
	});

	const otpauthUrl = secret.otpauth_url;
	const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

	const db = await getDb();
	await db.collection("mfaTemp").updateOne(
		{ userId: session.user.id },
		{ $set: { secretBase32: secret.base32, createdAt: new Date() } },
		{ upsert: true },
	);

	return NextResponse.json({ qrDataUrl });
}