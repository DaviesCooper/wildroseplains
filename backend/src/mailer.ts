import nodemailer from 'nodemailer';
import { config } from './config.js';

type MailInput = {
  subject: string;
  text: string;
  attachments?: {
    filename: string;
    path?: string;
    content?: Buffer;
    contentType?: string;
  }[];
};

const createTransporter = () => {
  const { host, port, user, pass } = config.email;
  if (!host || !port || !user || !pass) {
    throw new Error('SMTP configuration is missing (host, port, user, pass required)');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

export const sendEmail = async ({ subject, text, attachments }: MailInput) => {
  const from = config.email.user;

  // Hardcoded recipients per request
  const to = ['cooper@wildroseplains.ca', 'ben@wildroseplains.ca'];

  const transporter = createTransporter();
  await transporter.sendMail({
    from,
    to: to.join(','),
    subject,
    text,
    attachments,
  });
};

