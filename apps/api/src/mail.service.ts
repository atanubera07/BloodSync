import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { readConfig } from './config';
@Injectable()
export class MailService {
  async sendAction(email: string, kind: 'verify' | 'reset', token: string) {
    const config = readConfig();
    const url = new URL(kind === 'verify' ? '/verify-email' : '/reset-password', config.WEB_ORIGIN);
    url.searchParams.set('token', token);
    const transport = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      ...(config.SMTP_USER && config.SMTP_PASS
        ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } }
        : {}),
    });
    await transport.sendMail({
      from: config.MAIL_FROM,
      to: email,
      subject: kind === 'verify' ? 'Verify your BloodSync email' : 'Reset your BloodSync password',
      text: `Open this link to ${kind === 'verify' ? 'verify your email' : 'reset your password'}: ${url.toString()}\n\nIf you did not request this, ignore this message.`,
    });
  }
}
