async function testAdmin() {
  try {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "carenet.admin.support@gmail.com",
        password: "CareNetAdmin123!"
      })
    });
    const data = await res.json();
    console.log("Login Response:", data.success ? data.user : data);
  } catch (err) {
    console.error("Failed:", err.message);
  }
}
testAdmin();
