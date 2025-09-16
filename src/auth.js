import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getDb, mongoClient } from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import speakeasy from "speakeasy";

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
	otp: z.string().optional(),
});

const ENC_KEY = process.env.MFA_ENCRYPTION_KEY;

function encrypt(text) {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENC_KEY), iv);
	const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, enc]).toString("base64");
}

function decrypt(b64) {
	const raw = Buffer.from(b64, "base64");
	const iv = raw.subarray(0, 12);
	const tag = raw.subarray(12, 28);
	const enc = raw.subarray(28);
	const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENC_KEY), iv);
	decipher.setAuthTag(tag);
	const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
	return dec.toString("utf8");
}

async function verifyOtp(otp, secretEnc) {
	if (!secretEnc) return false;
	const secret = decrypt(secretEnc);
	return speakeasy.totp.verify({
		secret,
		encoding: "base32",
		token: otp,
		window: 1,
	});
}

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: MongoDBAdapter(mongoClient, {
		databaseName: process.env.MONGODB_DB,
	}),
	session: { strategy: "jwt" },
	pages: {
		signIn: "/sign-in",
	},
	providers: [
		Credentials({
			authorize: async (raw) => {
				const parsed = credentialsSchema.safeParse(raw);
				if (!parsed.success) return null;

				const { email, password, otp } = parsed.data;
				const db = await getDb();
				const users = db.collection("users");

				const user = await users.findOne({ email: email.toLowerCase() });
				if (!user || !user.passwordHash) return null;

				const ok = await bcrypt.compare(password, user.passwordHash);
				if (!ok) return null;

				if (user.mfaEnabled) {
					if (!otp || !(await verifyOtp(otp, user.mfaSecretEnc || null))) {
						throw new Error("MFA_REQUIRED");
					}
				}

				return {
					id: String(user._id),
					email: user.email,
					name: user.name || null,
					mfaEnabled: !!user.mfaEnabled,
				};
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.userId = user.id;
				token.mfaEnabled = user.mfaEnabled || false;
			}
			return token;
		},
		async session({ session, token }) {
			if (!session.user) session.user = {};
			session.user.id = token.userId;
			session.user.mfaEnabled = token.mfaEnabled || false;
			return session;
		},
	},
});