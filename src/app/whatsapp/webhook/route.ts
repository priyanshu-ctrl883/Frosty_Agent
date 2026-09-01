import { NextRequest, NextResponse } from "next/server";

const EXPECTED_VERIFY_TOKEN =
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "siteguide_wa_verify_token";

const BACKEND_URL =
  process.env.SITEGUIDE_UPSTREAM ||
  process.env.NEXT_PUBLIC_SITEGUIDE_API_URL ||
  "http://127.0.0.1:8002";

/**
 * GET /whatsapp/webhook
 * Handles Meta WhatsApp Cloud API initial verification handshake.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === EXPECTED_VERIFY_TOKEN) {
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Also try proxying to Python backend if token differs
  try {
    const backendRes = await fetch(
      `${BACKEND_URL.replace(/\/$/, "")}/whatsapp/webhook?${searchParams.toString()}`,
      { cache: "no-store" }
    );
    if (backendRes.ok) {
      const text = await backendRes.text();
      return new Response(text, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
  } catch {
    // ignore backend error if token already verified
  }

  return new Response("Verification token mismatch", { status: 403 });
}

/**
 * POST /whatsapp/webhook
 * Receives inbound WhatsApp events from Meta and forwards them to the Python backend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward asynchronously to SiteGuide backend
    fetch(`${BACKEND_URL.replace(/\/$/, "")}/whatsapp/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }).catch((err) => {
      console.warn("Failed forwarding WhatsApp webhook to backend:", err);
    });

    return new Response("EVENT_RECEIVED", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return new Response("EVENT_RECEIVED", { status: 200 });
  }
}
