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

    if (!mailResponse.ok) {
      const errorText = await mailResponse.text();

      return new Response(
        JSON.stringify({
          success: false,
          error: `Email failed to send: ${errorText}`
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
