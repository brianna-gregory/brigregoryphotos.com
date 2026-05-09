export async function onRequestPost({ request }) {
  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "Not provided");
    const email = String(formData.get("email") || "Not provided");
    const phone = String(formData.get("phone") || "Not provided");
    const session = String(formData.get("session") || "Not provided");
    const date = String(formData.get("date") || "Not provided");
    const location = String(formData.get("location") || "Not provided");
    const budget = String(formData.get("budget") || "Not provided");
    const message = String(formData.get("message") || "Not provided");

    const emailText = `
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
                email: "briannagregory763@gmail.com",
                name: "Brianna Gregory"
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
        subject: `New Photography Booking Inquiry from ${name}`,
        content: [
          {
            type: "text/plain",
            value: emailText
          }
        ]
      })
    });

    const mailResult = await mailResponse.text();

    if (!mailResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `MailChannels error: ${mailResult}`
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking inquiry sent successfully."
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown server error"
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

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Booking API is live. Submit the form using POST."
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
