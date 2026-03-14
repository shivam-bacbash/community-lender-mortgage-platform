import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export function getResendClient() {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return resend;
}
