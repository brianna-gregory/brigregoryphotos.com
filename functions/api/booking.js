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

    const emailBody = `
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
`;

    const mailResponse = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [
              {
                email: "booking@brigregoryphotos.com",
                name: "Brianna Gregory Photography"
              }
            ]
          }
        ],
        from: {
          email: "booking@brigregoryphotos.com",
          name: "Brianna Gregory Photography"
        },
        reply_to: {
          email: email,
          name: name
        },
        subject: "New Photography Booking Inquiry",
        content: [
          {
            type: "text/plain",
            value: emailBody
          }
        ]
      })
    });

    if (!mailResponse.ok) {
      const errorText = await mailResponse.text();

      return new Response(`Email failed to send: ${errorText}`, {
        status: 500
      });
    }

    return Response.redirect(
      "https://brigregoryphotos.com/main/booking/?success=true",
      303
    );
  } catch (error) {
    return new Response(`Something went wrong: ${error.message}`, {
      status: 500
    });
  }
}
