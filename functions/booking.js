export async function onRequestPost({ request }) {
  try {
    const formData = await request.formData();

    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone") || "Not provided";
    const session = formData.get("session");
    const date = formData.get("date");
    const location = formData.get("location") || "Not provided";
    const budget = formData.get("budget") || "Not provided";
    const message = formData.get("message");

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

    const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
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

    if (!response.ok) {
      return new Response("Email failed to send.", { status: 500 });
    }

    return Response.redirect(
      "https://brigregoryphotos.com/main/booking/?success=true",
      303
    );

  } catch (error) {
    return new Response("Something went wrong.", { status: 500 });
  }
}
