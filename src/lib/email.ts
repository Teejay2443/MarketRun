const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "MarketRun <noreply@marketrun.app>";

export async function sendVerificationEmail(email: string, code: string, purpose: "signup" | "login"): Promise<boolean> {
  const subject = purpose === "signup"
    ? "Verify your MarketRun email"
    : "Your MarketRun login code";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 48px; height: 48px; background: #0ea5e9; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="color: white; font-size: 24px;">🛒</span>
        </div>
      </div>
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 8px;">
        ${purpose === "signup" ? "Welcome to MarketRun!" : "Your Login Code"}
      </h1>
      <p style="text-align: center; color: #666; margin-bottom: 24px;">
        ${purpose === "signup"
          ? "Verify your email to start shopping with trusted community runners."
          : "Use the code below to sign in to your account."}
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

  // Try Resend API first
  if (RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject,
          html,
        }),
      });

      if (response.ok) {
        console.log(`Verification email sent to ${email}`);
        return true;
      } else {
        const error = await response.text();
        console.error("Resend API error:", error);
      }
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
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
