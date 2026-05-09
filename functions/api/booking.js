export async function onRequestPost({ request }) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") || "Not provided";
    const email = formData.get("email") || "Not provided";
    const phone = formData.get("phone") || "Not provided";
    const session = formData.get("session") || "Not provided";
    const date = formData.get("date") || "Not provided";
    const location = formData.get("location") || "Not provided";
    const budget = formData.get("budget") || "Not provided";
    const message = formData.get("message") || "Not provided";

    const payload = {
      from: "booking@brigregoryphotos.com",
      to: "gregorybri@outlook.com",
      subject: "New Photography Booking Inquiry",
      text: `
NEW PHOTOGRAPHY BOOKING INQUIRY

Full Name: ${name}
Email: ${email}
Phone: ${phone}
Session Type: ${session}
Preferred Date: ${date}
Preferred Location: ${location}
Estimated Budget: ${budget}

CLIENT VISION:
${message}
      `
    };

    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: "gregorybri@outlook.com" }]
          }
        ],
        from: {
          email: "booking@brigregoryphotos.com",
          name: "Brianna Gregory Photography"
        },
        subject: "New Photography Booking Inquiry",
        content: [
          {
            type: "text/plain",
            value: payload.text
          }
        ]
      })
    });

    return new Response(
      JSON.stringify({
        success: true
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
