import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const from = String(formData.get("from") || "");
    const to = String(formData.get("to") || "");
    const subject = String(formData.get("subject") || "");
    const html = String(formData.get("html") || "");

    const cc = formData.getAll("cc").map(String);
    const bcc = formData.getAll("bcc").map(String);

    if (!from || !to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const MAIL_API_URL = process.env.MAIL_API_URL;
    if (!MAIL_API_URL) {
      return NextResponse.json(
        { error: "MAIL_API_URL not configured" },
        { status: 500 },
      );
    }

    // 🔑 ensure CC/BCC are forwarded
    cc.forEach((email) => formData.append("cc", email));
    bcc.forEach((email) => formData.append("bcc", email));

    const res = await fetch(`${MAIL_API_URL}/api/send-email`, {
      method: "POST",
      body: formData,
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("MAIL API ERROR:", text);
      return NextResponse.json(
        { error: "Mail delivery failed", details: text },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("SEND ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err?.message || err) },
      { status: 500 },
    );
  }
}
