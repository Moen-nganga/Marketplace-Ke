const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(email, name, token, baseUrl) {
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  await transporter.sendMail({
    from:    `"Marketplace Ke" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: "Verify your Marketplace Ke account",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Rubik',Arial,sans-serif">
        <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
          <!-- Header -->
          <div style="background:#e02020;padding:32px 40px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:2px">MARKETPLACE KE</h1>
          </div>
          <!-- Body -->
          <div style="padding:40px">
            <h2 style="margin:0 0 12px;font-size:22px;color:#111">Hi ${name}! 👋</h2>
            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px">
              Thanks for signing up! Please verify your email address to activate your account and start buying and selling on Marketplace Ke.
            </p>
            <div style="text-align:center;margin-bottom:28px">
              <a href="${verifyUrl}"
                 style="display:inline-block;background:#e02020;color:#fff;
                        padding:14px 40px;border-radius:8px;text-decoration:none;
                        font-size:16px;font-weight:600;letter-spacing:0.5px">
                ✓ Verify My Account
              </a>
            </div>
            <p style="color:#888;font-size:13px;line-height:1.6;margin:0">
              This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
          <!-- Footer -->
          <div style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;text-align:center">
            <p style="color:#aaa;font-size:12px;margin:0">
              © 2026 Marketplace Ke · Kenya's free online marketplace
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

module.exports = { sendVerificationEmail };