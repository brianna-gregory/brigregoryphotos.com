export async function onRequestPost({ request }) {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Function is working."
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Booking API is live."
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
