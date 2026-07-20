import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, code: string, purpose: "signup" | "login" | "reset-password"): Promise<boolean> {
  const subject = purpose === "signup"
    ? "Verify your MarketRun email"
    : purpose === "reset-password"
    ? "Reset your MarketRun password"
    : "Your MarketRun login code";

  const heading = purpose === "signup"
    ? "Welcome to MarketRun!"
    : purpose === "reset-password"
    ? "Reset Your Password"
    : "Your Login Code";

  const description = purpose === "signup"
    ? "Verify your email to start shopping with trusted community runners."
    : purpose === "reset-password"
    ? "Use the code below to reset your password. If you didn't request this, ignore this email."
    : "Use the code below to sign in to your account.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 48px; height: 48px; background: #0ea5e9; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px;">&#128722;</span>
        </div>
      </div>
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 8px;">
        ${heading}
      </h1>
      <p style="text-align: center; color: #666; margin-bottom: 24px;">
        ${description}
      </p>
      <div style="background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #94a3b8; margin: 0 0 8px 0;">Your verification code</p>
        <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0f172a; margin: 0;">${code}</p>
        <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0 0;">Expires in 10 minutes</p>
      </div>
      <p style="text-align: center; font-size: 12px; color: #94a3b8;">
        If you didn't request this, please ignore this email.
      </p>
    </div>
  `;

  // Try Gmail SMTP first
  if (process.env.GOOGLE_EMAIL && process.env.GOOGLE_APP_PASSWORD) {
    try {
      await transporter.sendMail({
        from: `"MarketRun" <${process.env.GOOGLE_EMAIL}>`,
        to: email,
        subject,
        html,
      });
      console.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error("Gmail SMTP error:", error);
    }
  }

  // Fallback: log to console (for demo/development)
  console.log(`\n${"=".repeat(50)}`);
  console.log(`VERIFICATION CODE for ${email}`);
  console.log(`Purpose: ${purpose}`);
  console.log(`Code: ${code}`);
  console.log(`${"=".repeat(50)}\n`);

  return true;
}
