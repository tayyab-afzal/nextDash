import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { z } from "zod";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
	name: z.string().min(2).max(60),
	email: z.email(),
	password: z.string().min(8).max(128),
});

export async function POST(req) {
	try {
		console.log("[/api/register] POST called");
		const body = await req.json();
		const data = registerSchema.parse(body);

		const db = await getDb();
		
		const users = db.collection("users");

		const existing = await users.findOne({ email: data.email.toLowerCase() });
		if (existing) {
			console.log("[/api/register] duplicate email", data.email);
			return NextResponse.json({ error: "Email already in use" }, { status: 400 });
		}

		const passwordHash = await bcrypt.hash(data.password, 12);
		const now = new Date();
		await users.insertOne({
			name: data.name.trim(),
			email: data.email.toLowerCase(),
			passwordHash,
			createdAt: now,
			updatedAt: now,
		});

		console.log("[/api/register] user created", data.email);
		return NextResponse.json({ ok: true });
	} catch (e) {
		console.error("[/api/register] error", e);
		return NextResponse.json({ error: e.message || "Invalid request" }, { status: 400 });
	}
}