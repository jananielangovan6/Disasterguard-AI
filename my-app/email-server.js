import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

// Create nodemailer transporter with Google App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "disasterguard26@gmail.com",
    pass: "hsruqaxyanfijnav", // Google App Password without spaces
  },
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail SMTP Verification Error:", error);
  } else {
    console.log("✅ Gmail SMTP Ready! Connected as disasterguard26@gmail.com");
  }
});

// Endpoint to send real emails directly to recipient's personal inbox
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, body, html } = req.body;

    if (!to) {
      return res.status(400).json({ ok: false, error: "Recipient email is required" });
    }

    const mailOptions = {
      from: '"DisasterGuard AI" <disasterguard26@gmail.com>',
      to: to.trim(),
      subject: subject || "DisasterGuard AI Official Notification",
      text: body || "",
      html: html || `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">${(body || "").replace(/\n/g, "<br/>")}</div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ REAL EMAIL DELIVERED to ${to}! Message ID: ${info.messageId}`);
    return res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error("❌ Gmail SMTP Send Error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 DisasterGuard AI Real Email Server active at http://localhost:${PORT}`);
});
