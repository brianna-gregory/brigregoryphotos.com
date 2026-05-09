export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      service,
      date,
      message
    } = body;

    if (!name || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Name and email are required."
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    if (!env.MAILCHANNELS_API_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "MAILCHANNELS_API_KEY missing"
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    const emailPayload = {
      personalizations: [
        {
          to: [
            {
              email: "briannagregory763@gmail.com"
            }
          ]
        }
      ],
      from: {
        email: "booking@brigregoryphotos.com",
        name: "Brig Gregory Photos"
      },
      subject: `New Booking Inquiry from ${name}`,
      content: [
        {
          type: "text/plain",
          value: `
New Booking Inquiry

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Service: ${service || "Not provided"}
Preferred Date: ${date || "Not provided"}

Message:
${message || "No message provided"}
`
        }
      ]
    };

    const mailResponse = await fetch(
      "https://api.mailchannels.net/tx/v1/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.MAILCHANNELS_API_KEY}`
        },
        body: JSON.stringify(emailPayload)
      }
    );

    const responseText = await mailResponse.text();

    if (!mailResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: responseText
        }),
        {
          status: mailResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sent successfully"
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
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
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
}
