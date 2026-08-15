"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Check, FileText, Loader2, Mail, MapPin, Send } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/fx/reveal";
import { SocialLinks } from "@/components/ui/social-links";
import { StatusPulse } from "@/components/fx/effects";
import { profile } from "@/content/site";
import { cn } from "@/lib/utils";

type Fields = { name: string; email: string; subject: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

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

export function Contact() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  function update(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Clear the error for a field as soon as the user starts fixing it
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(fields);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("sending");

    /* ------------------------------------------------------------------
     * No server is wired up, so this hands the message to the visitor's
     * mail client rather than pretending to deliver it. To send properly,
     * replace this block with a fetch to your own route handler:
     *
     *   await fetch("/api/contact", {
     *     method: "POST",
     *     headers: { "Content-Type": "application/json" },
     *     body: JSON.stringify(fields),
     *   });
     * ------------------------------------------------------------------ */
    const body = `${fields.message}\n\n— ${fields.name} (${fields.email})`;
    const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(
      fields.subject
    )}&body=${encodeURIComponent(body)}`;

    window.setTimeout(() => {
      window.location.href = mailto;
      setStatus("sent");
    }, 700);
  }

  function reset() {
    setFields(EMPTY);
    setErrors({});
    setStatus("idle");
  }

  return (
    <section id="contact" className="relative scroll-mt-24 px-3 py-3 sm:px-5 lg:px-6">
      <div className="relative mx-auto w-full max-w-[100rem] overflow-hidden rounded-[1.75rem] border border-white/8 bg-panel px-6 py-14 sm:px-10 sm:py-16 lg:px-14">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* ---------------- Left: heading + direct routes ---------------- */}
          <div>
            <SectionHeading
              eyebrow="Contact"
              title={
                <>
                  Tell me what
                  <br />
                  <span className="text-orange-500">you&apos;re building</span>
                </>
              }
              description="Engineering work, a film, or just a good argument about lenses. The inbox is open."
            />

            <Reveal direction="up" delay={0.12} className="mt-8">
              <StatusPulse label={profile.availability} />
            </Reveal>

            {/* Contact rows with the same wipe treatment as the other lists */}
            <div className="mt-9 border-t border-white/8">
              <ContactRow
                index="01"
                label="Email"
                value={profile.email}
                href={`mailto:${profile.email}`}
                icon={Mail}
              />
              <ContactRow
                index="02"
                label="Based in"
                value={profile.location}
                icon={MapPin}
              />
              <ContactRow
                index="03"
                label="Résumé"
                value="Download PDF"
                href={profile.resumeUrl}
                icon={FileText}
              />
            </div>

            <Reveal direction="up" delay={0.2} className="mt-8">
              <p className="eyebrow mb-3 text-zinc-500">Find me elsewhere</p>
              <SocialLinks showLabels size="sm" />
            </Reveal>
          </div>

          {/* ---------------- Right: form ---------------- */}
          <Reveal direction="left" delay={0.1}>
            <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-panel-2 p-7 sm:p-9">
              <AnimatePresence mode="wait">
                {status === "sent" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="flex min-h-[28rem] flex-col items-center justify-center text-center"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 ring-1 ring-orange-500/40"
                    >
                      <Check className="h-8 w-8 text-orange-400" />
                    </motion.span>

                    <h3 className="mt-6 text-2xl font-bold text-white">Draft ready</h3>
                    <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-zinc-400">
                      Your message was handed to your mail app, pre-addressed to{" "}
                      <span className="text-orange-400">{profile.email}</span>. Hit send there and
                      it lands with me.
                    </p>

                    <button
                      onClick={reset}
                      className="mt-7 rounded-full border border-white/15 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:border-orange-500/60 hover:text-orange-300"
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

                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className={cn(
                        "group/send relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full",
                        "bg-orange-500 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300",
                        "hover:bg-orange-400",
                        "disabled:cursor-not-allowed disabled:opacity-70"
                      )}
                    >
                      {status === "sending" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Preparing…
                        </>
                      ) : (
                        <>
                          Send message
                          <Send className="h-4 w-4 transition-transform duration-300 group-hover/send:translate-x-1" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] leading-relaxed text-zinc-600">
                      Opens your mail client with the message pre-filled — nothing is sent or
                      stored by this site.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Contact row                                                                 */
/* -------------------------------------------------------------------------- */

function ContactRow({
  index,
  label,
  value,
  href,
  icon: Icon,
}: {
  index: string;
  label: string;
  value: string;
  href?: string;
  icon: typeof Mail;
}) {
  const inner = (
    <div className="relative flex items-center gap-5 px-3 py-5">
      {/* Orange wash wipes in from the left */}
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-orange-500/12 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:scale-x-100"
      />

      <span className="relative font-mono text-[11px] text-zinc-600 transition-colors duration-300 group-hover/row:text-orange-500">
        {index}
      </span>

      <div className="relative min-w-0 flex-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:translate-x-2">
        <span className="eyebrow block text-[9px] text-zinc-500">{label}</span>
        <span className="mt-1 block truncate text-[15px] font-medium text-white transition-colors duration-300 group-hover/row:text-orange-400">
          {value}
        </span>
      </div>

      <Icon className="relative h-4 w-4 shrink-0 text-zinc-600 transition-colors duration-300 group-hover/row:text-orange-500" />

      {href ? (
        <ArrowUpRight className="relative h-4 w-4 shrink-0 -translate-x-2 text-orange-500 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:translate-x-0 group-hover/row:opacity-100" />
      ) : null}
    </div>
  );

  const className = "group/row block overflow-hidden border-b border-white/8";

  return href ? (
    <a href={href} className={className}>
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
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
    "focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20",
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
          "peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-orange-400"
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
            className="mt-1.5 pl-1 text-[11px] text-red-400"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
