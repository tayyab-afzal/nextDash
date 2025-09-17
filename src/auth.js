import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getDb, mongoClient } from "@/lib/mongodb";
import { z } from "zod";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  code: z.string().min(6).max(6).optional(),
});

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// function getTransport() {
//   const host = process.env.EMAIL_SERVER_HOST;
//   const port = Number(process.env.EMAIL_SERVER_PORT || 587);
//   const user = process.env.EMAIL_SERVER_USER;
//   const pass = process.env.EMAIL_SERVER_PASSWORD;
//   if (!host || !user || !pass) throw new Error("EMAIL_SERVER_* env vars missing");
//   return nodemailer.createTransport({ host, port, auth: { user, pass } });
// }

// 👇 THIS is the part you must export
export const authOptions = {
  adapter: MongoDBAdapter(mongoClient, {
    databaseName: process.env.MONGODB_DB,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "Email + Password/Code",
      authorize: async (raw) => {
        console.log("NextAuth authorize called with raw:", raw);
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password, code } = parsed.data;
        const lower = email.toLowerCase();
        const db = await getDb();
        const users = db.collection("users");
        const loginCodes = db.collection("emailLoginCodes");

        const user = await users.findOne({ email: lower });
        if (!user) {
          console.log("NextAuth no user for:", lower);
          return null;
        }

        if (code) {
          console.log("[NextAuth] verifying code for", lower);
          const record = await loginCodes.findOne({ email: lower });
          if (!record) return null;
          if (record.expiresAt < new Date()) return null;
          const matches = await bcrypt.compare(code, record.codeHash);
          if (!matches) return null;
          await loginCodes.deleteOne({ _id: record._id });
          console.log("NextAuth code ok, signing in:", lower);
          return { id: String(user._id), email: user.email, name: user.name || null };
        }

        if (!password || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          console.log("[NextAuth] bad password for:", lower);
          return null;
        }

        const oneTime = generateCode();
        const codeHash = await bcrypt.hash(oneTime, 12);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await loginCodes.updateOne(
          { email: lower },
          { $set: { email: lower, codeHash, expiresAt } },
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
          text: `Your login code is ${oneTime}. It expires in 10 minutes.`,
          html: `<p>Your login code is <b>${oneTime}</b>. It expires in 10 minutes.</p>`,
        });
        console.log("[NextAuth] password ok; code sent to:", lower);
        throw new Error("CODE_REQUIRED");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) session.user = {};
      session.user.id = token.userId;
      return session;
    },
  },
};
