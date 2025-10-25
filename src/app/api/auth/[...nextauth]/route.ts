
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { createTransport } from "nodemailer";
import VerificationEmail from "@/emails/VerificationEmail";
import { render } from "@react-email/render";

// Wrap the PrismaAdapter to adapt emailVerified values to the schema's type (DateTime?)
const baseAdapter = PrismaAdapter(prisma as any);
const wrappedAdapter = {
  ...baseAdapter,

  // Convert boolean/date/string values into Date|null so Prisma receives DateTime?
  async updateUser(payload: any) {
    const { id, ...data } = payload || {};
    if (data && Object.prototype.hasOwnProperty.call(data, 'emailVerified')) {
      const val = data.emailVerified;
  if (val === true) data.emailVerified = (new Date() as any);
      else if (val === false) data.emailVerified = null;
  else if (typeof val === 'string' && !isNaN(Date.parse(val))) data.emailVerified = (new Date(val) as any);
      // leave Date instances as-is
    }
    return (baseAdapter as any).updateUser({ id, ...data });
  },

  async createUser(payload: any) {
    const { id, ...data } = payload || {};
    if (data && Object.prototype.hasOwnProperty.call(data, 'emailVerified')) {
      const val = data.emailVerified;
  if (val === true) data.emailVerified = (new Date() as any);
  else if (val === false) data.emailVerified = null;
  else if (typeof val === 'string' && !isNaN(Date.parse(val))) data.emailVerified = (new Date(val) as any);
    }
    return (baseAdapter as any).createUser({ id, ...data });
  },
};

export const authOptions: any = {
  adapter: wrappedAdapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        
        if (!user) {
            throw new Error("No user found with this email.");
        }

        if (!user.emailVerified) {
            throw new Error("Please verify your email before signing in.");
        }
        
        if (!user.passwordHash) {
            throw new Error("Password not set up for this account. Try a different sign-in method.");
        }
        
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
            throw new Error("Incorrect password.");
        }

        return { id: user.id, email: user.email, name: user.fullName, roles: user.roles, emailVerified: user.emailVerified } as any;
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
      // Attempt to include the recipient's name in the verification email when available
    const user = await prisma.user.findUnique({ where: { email } });
    const emailHtml = await render(VerificationEmail({ link: url, name: user?.fullName ?? undefined }));

        try {
          const result = await transport.sendMail({
            to: email,
            from: provider.from,
            subject: "Verify your email for AfriConnect Exchange",
            html: emailHtml,
          });

          // Log successful email sending
          const user = await prisma.user.findUnique({ where: { email } });
          await prisma.emailLog.create({
            data: {
              userId: user?.id,
              recipientEmail: email,
              senderEmail: provider.from,
              subject: "Verify your email for AfriConnect Exchange",
              templateName: "VerificationEmail",
              provider: "Nodemailer",
              providerMessageId: result.messageId,
              status: "sent",
              sentAt: new Date(),
            },
          });
        } catch (error) {
          // Log failed email sending
          const user = await prisma.user.findUnique({ where: { email } });
          await prisma.emailLog.create({
            data: {
              userId: user?.id,
              recipientEmail: email,
              senderEmail: provider.from,
              subject: "Verify your email for AfriConnect Exchange",
              templateName: "VerificationEmail",
              provider: "Nodemailer",
              status: "failed",
              failedAt: new Date(),
              failureReason: (error as Error).message,
            },
          });
          throw error; // Re-throw error to notify NextAuth
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

  session: { strategy: "database" },

  callbacks: {
    async session({ session, user }: any) {
      if (session?.user && user) {
        session.user.id = user.id;
        session.user.roles = user.roles || [];
        // expose some commonly-used profile flags to the client session
        session.user.emailVerified = !!user.emailVerified;
        session.user.phone = user.phone ?? null;
        session.user.address = user.address ?? null;
        session.user.onboardingComplete = !!(user.phone && user.address);
      }
      return session;
    },
  async signIn({ user, account }: any) {
    // For OAuth providers, mark email as verified and activate account
    if (account.provider !== 'credentials') {
      if (user.email) {
        await prisma.user.update({
          where: { email: user.email },
          // store verification timestamp and mark verificationStatus
          data: { emailVerified: (new Date() as any), status: 'active', verificationStatus: 'verified' }
        });
      }
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});
    const base = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000';

    if (!dbUser?.emailVerified) {
      // If the user somehow isn't verified, redirect to the verify page
      return `${base}/auth/verify-email`;
    }

    // If user hasn't completed onboarding (phone/address), redirect them there
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
            const session = await prisma.session.findFirst({
                where: { userId: user.id },
                orderBy: { expires: 'desc' },
            });

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    loginCount: { increment: 1 },
                },
            });

            if (session) {
        const userSession = await prisma.userSession.upsert({
          where: { sessionToken: session.sessionToken },
          update: {
            lastActivityAt: new Date(),
            isActive: true,
            revokedAt: null,
          },
          create: {
            userId: user.id,
            sessionToken: session.sessionToken,
            expiresAt: session.expires,
          }
        });

        // Record activity against the user_session row (userSession.id), not the NextAuth session id
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            sessionId: userSession.id,
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
            const userSession = await prisma.userSession.findUnique({
                where: { sessionToken: session.sessionToken },
                include: { user: true }
            });

            if (userSession) {
                await prisma.userSession.update({
                    where: { sessionToken: session.sessionToken },
                    data: {
                        isActive: false,
                        revokedAt: new Date(),
                    },
                });

                await prisma.activityLog.create({
                    data: {
            userId: userSession.userId,
            sessionId: userSession.id,
                        action: "USER_SIGN_OUT_SUCCESS",
                    },
                });
            }
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

const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };
