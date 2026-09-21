fetch("http://localhost:5000/api/send-email", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    to: "dhiyanadhiya24@gmail.com",
    subject: "DisasterGuard AI Official Test Email",
    body: "Hello! This is a test email sent directly from disasterguard26@gmail.com to your personal mailbox.",
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("TEST EMAIL RESULT:", data))
  .catch((err) => console.error("TEST EMAIL ERROR:", err));
