import { NextResponse } from "next/server";
import { escapeHtml, headerSafe, isMailConfigured, mailer, readMailConfig } from "@/lib/mail";
import { getProfile } from "@/lib/content/profile";

/** nodemailer opens TCP sockets, so this cannot run on the edge runtime. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  /** Honeypot — a real person never sees this field, so anything in it is a bot. */
  company?: string;
};

const LIMITS = { name: 80, email: 160, subject: 140, message: 4000 };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(body: Payload): { ok: true; data: Required<Omit<Payload, "company">> } | { ok: false; error: string } {
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();

  if (name.length < 2) return { ok: false, error: "Please enter your name." };
  if (!EMAIL.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (subject.length < 3) return { ok: false, error: "Add a short subject." };
  if (message.length < 12) return { ok: false, error: "Tell me a bit more (12+ characters)." };

  // The client validates the same rules; this is the copy that counts, since
  // the endpoint is reachable directly.
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    subject.length > LIMITS.subject ||
    message.length > LIMITS.message
  ) {
    return { ok: false, error: "That message is longer than this form accepts." };
  }

  return { ok: true, data: { name, email, subject, message } };
}

/**
 * Per-IP rate limit.
 *
 * In-process and therefore per-instance — it resets on redeploy and doesn't
 * coordinate across serverless instances. That's the right trade here: it costs
 * nothing, stops the obvious case of one script hammering the form, and the
 * honeypot catches most of the rest. Reach for a shared store only if this
 * actually starts getting abused.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // Opportunistic sweep so the map can't grow without bound.
  if (hits.size > 500) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  if (!isMailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Email isn't configured on the server. Add SMTP_HOST, SMTP_USER and SMTP_PASS to .env.local.",
        // Lets the form fall back to opening the visitor's mail client rather
        // than dead-ending on an error they can do nothing about.
        fallback: true,
      },
      { status: 503 }
    );
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  // Silently accept honeypot hits: telling a bot it was caught just teaches it
  // to fill the field in next time.
  if (body.company) return NextResponse.json({ ok: true });

  const result = validate(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "That's a few messages in a short time — try again in a little while." },
      { status: 429 }
    );
  }

  const { name, email, subject, message } = result.data;
  const config = readMailConfig()!;
  const profile = await getProfile();

  try {
    await mailer(config).sendMail({
      from: `"${headerSafe(name)} via portfolio" <${config.from}>`,
      to: config.to,
      // The visitor's address goes here, not in `from`, so hitting reply works
      // while the envelope sender stays an address the SMTP account owns.
      replyTo: `"${headerSafe(name)}" <${headerSafe(email)}>`,
      subject: headerSafe(subject),
      text: `${message}\n\n— ${name} <${email}>`,
      html:
        `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#18181b">` +
        `<p style="white-space:pre-wrap;margin:0 0 24px">${escapeHtml(message)}</p>` +
        `<hr style="border:0;border-top:1px solid #e4e4e7;margin:24px 0">` +
        `<p style="margin:0;font-size:13px;color:#71717a">` +
        `${escapeHtml(name)} &lt;<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>&gt;` +
        `<br>Sent from the contact form on ${escapeHtml(profile.name)}&rsquo;s site.` +
        `</p></div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Log the real reason server-side; the visitor gets something actionable
    // without leaking host names or credentials.
    console.error("[contact] send failed:", error);
    return NextResponse.json(
      { error: "The message couldn't be sent just now.", fallback: true },
      { status: 502 }
    );
  }
}
