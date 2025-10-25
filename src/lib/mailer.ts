import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import prisma from './prisma';

type EmailJob = {
  to: string;
  subject: string;
  html: string;
  templateName?: string;
  userId?: string | null;
};

const REDIS_URL = process.env.REDIS_URL || '';
let queue: Queue<EmailJob> | null = null;

if (REDIS_URL) {
  const connection = new IORedis(REDIS_URL);
  queue = new Queue<EmailJob>('emailQueue', { connection });
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT || 587),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

async function sendNow(job: EmailJob) {
  // Try nodemailer first
  const transport = createTransport();
  try {
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: job.to,
      subject: job.subject,
      html: job.html,
    });

    // Log success
    await prisma.emailLog.create({
      data: {
        userId: job.userId,
        recipientEmail: job.to,
        senderEmail: process.env.EMAIL_FROM,
        subject: job.subject,
        templateName: job.templateName,
        provider: 'Nodemailer',
        providerMessageId: (info as any).messageId,
        status: 'sent',
        sentAt: new Date(),
      },
    });

    return { provider: 'Nodemailer', id: (info as any).messageId };
  } catch (err: any) {
    console.error('Mailer sendNow nodemailer failed:', err?.message || err);
    // Try fallback to Resend if available
    if (process.env.RESEND_API_KEY) {
      try {
        // dynamic import to avoid adding dependency when not used
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const resp = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'no-reply@example.com',
          to: job.to,
          subject: job.subject,
          html: job.html,
        });

        await prisma.emailLog.create({
          data: {
            userId: job.userId,
            recipientEmail: job.to,
            senderEmail: process.env.EMAIL_FROM,
            subject: job.subject,
            templateName: job.templateName,
            provider: 'Resend',
            providerMessageId: (resp as any).id,
            status: 'sent',
            sentAt: new Date(),
          },
        });

        return { provider: 'Resend', id: (resp as any).id };
      } catch (err2: any) {
        console.error('Resend fallback failed:', err2?.message || err2);
        await prisma.emailLog.create({
          data: {
            userId: job.userId,
            recipientEmail: job.to,
            senderEmail: process.env.EMAIL_FROM,
            subject: job.subject,
            templateName: job.templateName,
            provider: 'Nodemailer',
            status: 'failed',
            failedAt: new Date(),
            failureReason: String(err2?.message || err2),
          },
        });
        throw err2;
      }
    }

    // log failure
    await prisma.emailLog.create({
      data: {
        userId: job.userId,
        recipientEmail: job.to,
        senderEmail: process.env.EMAIL_FROM,
        subject: job.subject,
        templateName: job.templateName,
        provider: 'Nodemailer',
        status: 'failed',
        failedAt: new Date(),
        failureReason: String(err?.message || err),
      },
    });

    throw err;
  }
}

export async function enqueueEmail(job: EmailJob) {
  if (queue) {
    await queue.add('send', job, { attempts: 5, backoff: { type: 'exponential', delay: 1000 } });
    return { queued: true };
  }

  // No queue configured — send synchronously with simple retries
  const maxAttempts = 3;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      const res = await sendNow(job);
      return { queued: false, result: res };
    } catch (err) {
      attempt++;
      const wait = 500 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  throw new Error('Failed to send email after retries');
}

// Optional worker starter for BullMQ — run as a separate process
export function startEmailWorker() {
  if (!REDIS_URL) return null;
  const connection = new IORedis(REDIS_URL);
  const worker = new Worker<EmailJob>(
    'emailQueue',
    async (job) => {
      try {
        await sendNow(job.data);
        return true;
      } catch (err) {
        console.error('Email job failed:', err);
        throw err;
      }
    },
    { connection }
  );

  worker.on('failed', (job, err) => {
    console.error('Email job failed permanently:', job?.id, err?.message || err);
  });

  return worker;
}

export default { enqueueEmail, startEmailWorker };
