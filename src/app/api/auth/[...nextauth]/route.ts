// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createTransport } from "nodemailer";
import VerificationEmail from "@/emails/VerificationEmail";
import { render } from "@react-email/render";

// ✅ NO CUSTOM WRAPPER - Use adapter directly
export const authOptions: any = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email } 
        });
        
        if (!user) {
          throw new Error("No user found with this email.");
        }

        // ✅ Check emailVerified as DateTime, not boolean
        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in.");
        }
        
        if (!user.passwordHash) {
          throw new Error("Password not set. Try OAuth sign-in.");
        }
        
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          throw new Error("Incorrect password.");
        }

        // ✅ Return proper user object
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          emailVerified: user.emailVerified,
        };
      },
    }),

    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const transport = createTransport(provider.server);
        const user = await prisma.user.findUnique({ where: { email } });
        const emailHtml = await render(
          VerificationEmail({ 
            link: url, 
            name: user?.fullName ?? undefined 
          })
        );

        try {
          const result = await transport.sendMail({
            to: email,
            from: provider.from,
            subject: "Verify your email for AfriConnect Exchange",
            html: emailHtml,
          });

          await prisma.emailLog.create({
            data: {
              userId: user?.id,
              recipientEmail: email,
              senderEmail: provider.from,
              subject: "Verify your email",
              templateName: "VerificationEmail",
              provider: "Nodemailer",
              providerMessageId: result.messageId,
              status: "sent",
              sentAt: new Date(),
            },
          });
        } catch (error) {
          await prisma.emailLog.create({
            data: {
              userId: user?.id,
              recipientEmail: email,
              senderEmail: provider.from,
              subject: "Verify your email",
              templateName: "VerificationEmail",
              provider: "Nodemailer",
              status: "failed",
              failedAt: new Date(),
              failureReason: (error as Error).message,
            },
          });
          throw error;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  // ✅ Use database strategy with Prisma adapter
  session: { 
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async session({ session, user }: any) {
      if (session?.user && user) {
        session.user.id = user.id;
        session.user.roles = user.roles || [];
        session.user.emailVerified = !!user.emailVerified;
        session.user.phone = user.phone ?? null;
        session.user.address = user.address ?? null;
        session.user.onboardingComplete = !!(user.phone && user.address);
      }
      return session;
    },

    async signIn({ user, account }: any) {
      // For OAuth providers, mark email as verified
      if (account?.provider !== 'credentials') {
        if (user.email) {
          await prisma.user.update({
            where: { email: user.email },
            data: { 
              emailVerified: new Date(),
              status: 'active',
              verificationStatus: 'verified'
            }
          });
        }
      }

      // Resolve DB user safely: some provider/user.id values might not be UUIDs
      // (Prisma schema expects UUID for users.id). Attempt a guarded lookup by
      // id only when it looks like a UUID; otherwise fall back to email lookup.
      let dbUser = null as any;
      try {
        const isPossiblyUuid = typeof user?.id === 'string' && /^[0-9a-fA-F-]{32,36}$/.test((user.id || '').replace(/-/g, ''));
        if (isPossiblyUuid) {
          dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        }
      } catch (err) {
        // If Prisma throws while coercing to UUID, swallow and try fallback
        console.warn('signIn: id lookup failed, falling back to email lookup', err);
        dbUser = null;
      }

      if (!dbUser && user?.email) {
        dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      }

      if (process.env.NODE_ENV === 'development') {
        try {
          // eslint-disable-next-line no-console
          console.debug('NextAuth signIn callback - provider:', account?.provider, 'user:', user, 'dbUser:', dbUser);
        } catch (err) {
          // ignore
        }
      }
      
      const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000';

      if (!dbUser?.emailVerified) {
        return `${base}/auth/verify-email`;
      }

      const needsOnboarding = !dbUser.phone || !dbUser.address;
      if (needsOnboarding) {
        return `${base}/onboarding?redirect=true`;
      }

      return true;
    }
  },

  events: {
    async signIn({ user }: any) {
      if (!user.id) return;
      
      try {
        // ✅ Update user login stats
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
          },
        });

        // ✅ Log activity using the NextAuth session
        const session = await prisma.session.findFirst({
          where: { userId: user.id },
          orderBy: { expires: 'desc' },
        });

        if (session) {
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              sessionId: session.id,
              action: "USER_SIGN_IN_SUCCESS",
            },
          });
        }
      } catch (error) {
        console.error("Error in signIn event:", error);
      }
    },

    async signOut({ session }: any) {
      if (!session.sessionToken) return;
      
      try {
        await prisma.activityLog.create({
          data: {
            userId: session.userId,
            action: "USER_SIGN_OUT_SUCCESS",
          },
        });
      } catch (error) {
        console.error("Error in signOut event:", error);
      }
    },

    async createUser(message: any) {
      const user = message.user;
      if (user.email && !user.fullName) {
        await prisma.user.update({
          where: { id: user.id },
          data: { fullName: user.email.split('@')[0] }
        });
      }
    }
  },

  pages: { 
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-email",
    error: "/auth/signin", 
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };