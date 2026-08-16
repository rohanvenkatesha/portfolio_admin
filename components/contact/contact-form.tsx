"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check, Loader2, Send } from "lucide-react";
import { profile } from "@/content/site";
import { cn } from "@/lib/utils";

type Fields = { name: string; email: string; subject: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;
/** "sent" went out over SMTP; "mailto" fell back to the visitor's mail client. */
type Status = "idle" | "sending" | "sent" | "mailto";

const EMPTY: Fields = { name: "", email: "", subject: "", message: "" };

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (fields.name.trim().length < 2) errors.name = "Please enter your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.trim()))
    errors.email = "Enter a valid email address";
  if (fields.subject.trim().length < 3) errors.subject = "Add a short subject";
  if (fields.message.trim().length < 12) errors.message = "Tell me a bit more (12+ characters)";
  return errors;
}

export function ContactForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  /** Honeypot. Hidden from people, so anything here came from a bot. */
  const [company, setCompany] = useState("");

  function update(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Clear the error as soon as the user starts fixing that field
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  /** Hand the message to the visitor's mail client — used when SMTP can't. */
  function openMailClient() {
    const body = `${fields.message}\n\n— ${fields.name} (${fields.email})`;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
      fields.subject
    )}&body=${encodeURIComponent(body)}`;
    setStatus("mailto");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSendError(null);
    setStatus("sending");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, company }),
      });

      if (response.ok) {
        setStatus("sent");
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        fallback?: boolean;
      };

      // The server flags the failures a visitor can still route around —
      // SMTP not configured, or the provider refusing right now. Rather than
      // dead-ending them, hand the message to their mail client instead.
      if (data.fallback) {
        openMailClient();
        return;
      }

      setSendError(data.error ?? "Something went wrong. Please try again.");
      setStatus("idle");
    } catch {
      // Offline or the request never landed — the mail client still works.
      openMailClient();
    }
  }

  function reset() {
    setFields(EMPTY);
    setErrors({});
    setSendError(null);
    setStatus("idle");
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-panel-2 p-7 sm:p-9">
      <AnimatePresence mode="wait">
        {status === "sent" || status === "mailto" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex min-h-[26rem] flex-col items-center justify-center text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15 ring-1 ring-brand-500/40"
            >
              <Check className="h-8 w-8 text-brand-400" />
            </motion.span>

            {status === "sent" ? (
              <>
                <h3 className="mt-6 text-2xl font-bold text-white">Message sent</h3>
                <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-zinc-400">
                  It landed in{" "}
                  <span className="text-brand-400">{profile.email}</span>. I&apos;ll get back to
                  you shortly — usually within a day or two.
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-6 text-2xl font-bold text-white">Draft ready</h3>
                <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-zinc-400">
                  Sending directly didn&apos;t go through, so your message was handed to your mail
                  app instead, pre-addressed to{" "}
                  <span className="text-brand-400">{profile.email}</span>. Hit send there and it
                  lands with me.
                </p>
              </>
            )}

            <button
              onClick={reset}
              className="mt-7 rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:border-brand-500/60 hover:text-brand-300"
            >
              Write another
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="name"
                label="Your name"
                value={fields.name}
                error={errors.name}
                onChange={(v) => update("name", v)}
              />
              <Field
                id="email"
                type="email"
                label="Email address"
                value={fields.email}
                error={errors.email}
                onChange={(v) => update("email", v)}
              />
            </div>

            <Field
              id="subject"
              label="Subject"
              value={fields.subject}
              error={errors.subject}
              onChange={(v) => update("subject", v)}
            />

            <Field
              id="message"
              label="Your message"
              textarea
              value={fields.message}
              error={errors.message}
              onChange={(v) => update("message", v)}
            />

            {/* Honeypot: off-screen rather than display:none, since some bots
                skip fields they can tell are hidden. Never focusable or
                announced, so nobody using the form can land in it. */}
            <div aria-hidden className="absolute left-[-9999px] top-0 h-px w-px overflow-hidden">
              <input
                suppressHydrationWarning
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <AnimatePresence>
              {sendError ? (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-3.5 py-3 text-[12.5px] leading-relaxed text-red-300"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {sendError}
                </motion.p>
              ) : null}
            </AnimatePresence>

            <button
              type="submit"
              disabled={status === "sending"}
              className={cn(
                "group/send relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full",
                "ember-fill px-6 py-3.5 text-sm font-semibold text-[var(--brand-ink)]",
                "hover:ember-fill-hot",
                "disabled:cursor-not-allowed disabled:opacity-70"
              )}
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send message
                  <Send className="h-4 w-4 transition-transform duration-300 group-hover/send:translate-x-1" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] leading-relaxed text-zinc-600">
              Sent straight to my inbox — nothing is stored by this site.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Floating-label field                                                        */
/* -------------------------------------------------------------------------- */

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  textarea = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  textarea?: boolean;
}) {
  const shared = cn(
    "peer w-full rounded-xl border bg-panel px-4 pb-2.5 pt-6 text-sm text-white",
    "placeholder-transparent outline-none transition-all duration-200",
    "focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20",
    error ? "border-red-500/50" : "border-white/10 hover:border-white/20"
  );

  return (
    <div className={cn("relative", textarea && "sm:col-span-2")}>
      {textarea ? (
        <textarea
          suppressHydrationWarning
          id={id}
          rows={5}
          placeholder={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(shared, "resize-none")}
        />
      ) : (
        <input
          suppressHydrationWarning
          id={id}
          type={type}
          placeholder={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={shared}
        />
      )}

      {/* Label floats up once the field has content or focus */}
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 top-2 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 transition-all duration-200",
          "peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal",
          "peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-brand-400"
        )}
      >
        {label}
      </label>

      <AnimatePresence>
        {error ? (
          <motion.p
            id={`${id}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1.5 flex items-center gap-1.5 pl-1 text-[11px] text-red-400"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
