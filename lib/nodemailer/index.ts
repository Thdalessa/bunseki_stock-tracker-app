import * as nodemailer from "nodemailer";
import {
  WELCOME_EMAIL_TEMPLATE,
  NEWS_SUMMARY_EMAIL_TEMPLATE,
} from "./templates";
import { DASHBOARD_URL } from "../constants";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

/**
 * Generate unsubscribe URL for email templates
 * The actual implementation depends on your email service/user database
 * For now, we'll use a placeholder that can be customized per user
 */
const getUnsubscribeUrl = (email: string): string => {
  // Example implementation using dashboard URL with email as parameter
  return `${DASHBOARD_URL}/unsubscribe?email=${encodeURIComponent(email)}`;
};

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const unsubscribeUrl = getUnsubscribeUrl(email);
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replaceAll("{{name}}", name)
    .replaceAll("{{intro}}", intro)
    .replaceAll("{{dashboardUrl}}", DASHBOARD_URL)
    .replaceAll("{{unsubscribeUrl}}", unsubscribeUrl);

  const mailOptions = {
    from: `"Bunseki" <noreply@bunseki.com>`, //this might have to change since it's not a real email
    to: email,
    subject: `Welcome to Bunseki - your stock market toolkit is ready!`,
    text: "Thanks for joining Bunseki",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsEmail = async ({
  email,
  name,
  summary,
}: NewsEmailData) => {
  const unsubscribeUrl = getUnsubscribeUrl(email);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replaceAll("{{date}}", today)
    .replaceAll("{{newsContent}}", summary)
    .replaceAll("{{dashboardUrl}}", DASHBOARD_URL)
    .replaceAll("{{unsubscribeUrl}}", unsubscribeUrl);

  const mailOptions = {
    from: `"Bunseki" <noreply@bunseki.com>`,
    to: email,
    subject: `📊 Today's Market News Summary - ${today}`,
    text: "Today's market news summary",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
