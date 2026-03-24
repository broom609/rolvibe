import { Resend } from 'resend'

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@rolvibe.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rolvibe.com'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

export async function sendWelcomeEmail(to: string, username: string) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Rolvibe.',
    html: `<p>Hey ${username},</p><p>Welcome to Rolvibe — where vibe coders get discovered.</p><p>Start exploring apps or <a href="${APP_URL}/dashboard/submit">submit your own</a>.</p><p>— The Rolvibe team</p>`,
  })
}

export async function sendAppSubmittedEmail(to: string, appName: string) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `We received your submission for ${appName}`,
    html: `<p>We received your submission for <strong>${appName}</strong>.</p><p>We'll review it within 24 hours and notify you of the decision.</p><p>— The Rolvibe team</p>`,
  })
}

export async function sendAppApprovedEmail(to: string, appName: string, appSlug: string) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your app ${appName} is live on Rolvibe`,
    html: `<p>Great news — <strong>${appName}</strong> is now live on Rolvibe.</p><p>Share it: <a href="${APP_URL}/apps/${appSlug}">${APP_URL}/apps/${appSlug}</a></p><p>— The Rolvibe team</p>`,
  })
}

export async function sendAppRejectedEmail(to: string, appName: string, reason: string) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Update on your submission: ${appName}`,
    html: `<p>Your app <strong>${appName}</strong> was not approved.</p><p><strong>Reason:</strong> ${reason}</p><p>You can revise your app and <a href="${APP_URL}/dashboard/submit">resubmit</a>.</p><p>— The Rolvibe team</p>`,
  })
}
