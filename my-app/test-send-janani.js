fetch("http://localhost:5000/api/send-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "janani2jothi@gmail.com",
    subject: "DisasterGuard AI — Citizen Registration Verification OTP Code: 781098",
    body: "Dear Citizen,\n\nYour 6-digit Citizen Registration Verification OTP Code for DisasterGuard AI is: 781098\n\nPlease enter this code on the registration screen.\n\nFrom: disasterguard26@gmail.com",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #059669, #2563eb); padding: 18px; border-radius: 10px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px;">DisasterGuard AI</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Citizen Registration Email Verification</p>
        </div>
        <div style="padding: 20px 10px; color: #334155; text-align: center;">
          <p style="font-size: 15px; color: #0f172a;">Hello <strong>Janani</strong>,</p>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;">Your 6-digit Citizen Registration Verification OTP Code is:</p>
          <div style="background-color: #f0fdf4; border: 2px dashed #10b981; padding: 16px; border-radius: 10px; display: inline-block; margin: 10px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #047857;">781098</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">Sent automatically by <strong>DisasterGuard AI</strong> (<code>disasterguard26@gmail.com</code>)</p>
        </div>
      </div>
    `
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("RESULT FOR JANANI:", data))
  .catch((err) => console.error("ERROR FOR JANANI:", err));
