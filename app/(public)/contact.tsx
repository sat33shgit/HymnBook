"use client";

import { useState, useEffect } from "react";
import {
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_NAME_MAX,
  CONTACT_REQUEST_TYPES,
} from "@/lib/validations/contact";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "", type: "Song request", consent: true, subscribe: false });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  // Left-side subscribe controls
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState("");
  // `subscribeError` is intentionally kept for API error messages but
  // not surfaced elsewhere — keep state for future UX improvements.
  const [subscribeError, setSubscribeError] = useState("");
  const [subscribeValid, setSubscribeValid] = useState(false);

  // Validate subscribe email as the user types
  useEffect(() => {
    const email = subscribeEmail.trim();
    if (!email) {
      setSubscribeValid(false);
      setSubscribeError("");
      return;
    }

    const ok = /^\S+@\S+\.\S+$/.test(email);
    setSubscribeValid(ok);
    if (!ok) {
      setSubscribeError("");
    }
  }, [subscribeEmail]);

  const validate = () => {
    const errs: { name?: string; email?: string; message?: string } = {};
    if (!form.name.trim()) {
      errs.name = "Name is required.";
    } else if (/\d/.test(form.name)) {
      errs.name = "Name cannot contain numbers.";
    } else if (form.name.length > CONTACT_NAME_MAX) {
      errs.name = `Name must be at most ${CONTACT_NAME_MAX} characters.`;
    }
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = "Enter a valid email address.";
    } else if (form.email.length > CONTACT_EMAIL_MAX) {
      errs.email = `Email must be at most ${CONTACT_EMAIL_MAX} characters.`;
    }
    if (!form.message.trim()) {
      errs.message = "Message is required.";
    } else if (form.message.length > CONTACT_MESSAGE_MAX) {
      errs.message = `Message must be at most ${CONTACT_MESSAGE_MAX} characters.`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: target.checked }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    const value = (target as HTMLInputElement | HTMLTextAreaElement).value;

    if (name === "name") {
      const sanitized = value.replace(/\d/g, "").slice(0, CONTACT_NAME_MAX);
      setForm((prev) => ({ ...prev, [name]: sanitized }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");

    // capture subscribe choice and email before we clear form
    const shouldSubscribe = Boolean(form.subscribe);
    const emailToSubscribe = (form.email || "").trim();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      // If user opted to subscribe via the contact form, add them to subscribers.
      if (shouldSubscribe && emailToSubscribe && /^\S+@\S+\.\S+$/.test(emailToSubscribe)) {
        try {
          const subRes = await fetch("/api/subscribers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailToSubscribe }),
          });
          // ignore response details; subscription endpoint returns exists flag on duplicates
          await subRes.json().catch(() => ({}));
        } catch (subErr) {
          // log but don't fail the main flow
          console.error("Failed to subscribe contact email:", subErr);
        }
      }

      setSubmitted(true);
      setForm({ name: "", email: "", message: "", type: "Song request", consent: true, subscribe: false });
      setErrors({});
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeError("");
    setSubscribeSuccess("");

    const email = subscribeEmail.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setSubscribeError("Enter a valid email address.");
      setSubscribeValid(false);
      return;
    }

    setSubscribeLoading(true);
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      if (data.exists) {
        setSubscribeSuccess("You're already subscribed.");
      } else {
        setSubscribeSuccess("Subscribed — please check your email for confirmation.");
      }
      setSubscribeEmail("");
    } catch (err) {
      setSubscribeError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setSubscribeLoading(false);
    }
  };

  return (
    <div className="space-y-5 px-4 py-6 md:space-y-8 md:px-0 md:py-0">
      <section className="mx-auto w-full max-w-6xl">
        <div className="rounded-[1.7rem] border border-[var(--desktop-panel-border)] bg-[var(--desktop-panel)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.07)] dark:shadow-[0_18px_38px_rgba(2,6,23,0.28)] overflow-hidden box-border">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left / hero column */}
            <aside className="md:col-span-5 p-4">
              <div className="bg-gradient-to-br from-white via-emerald-50/40 to-blue-50/60 dark:from-[#101624] dark:via-[#18213a] dark:to-[#1a2236] rounded-[1.25rem] p-4 sm:p-6 h-full flex flex-col gap-6 box-border">
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 dark:bg-blue-400/10 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-400">
                    We would love to hear from you
                  </div>

                  <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-950 dark:text-white leading-tight">
                    Thank you for visiting
                    <span className="block text-blue-600 dark:text-blue-400 text-lg sm:text-2xl md:text-3xl">our song library</span>
                  </h1>

                  <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg">
                    Share your feedback, suggest corrections, or request new songs. Every message helps us improve the collection and make it more useful for everyone.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="w-full max-w-[140px] mx-auto rounded-2xl bg-white dark:bg-[#0b1220] p-3 sm:p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col items-center text-center box-border">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                        <path d="M8 10h8M8 14h5" />
                        <path d="M6 5h12a2 2 0 0 1 2 2v11l-4-3H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                      </svg>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Feedback</div>
                  </div>

                  <div className="w-full max-w-[140px] mx-auto rounded-2xl bg-white dark:bg-[#0b1220] p-3 sm:p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col items-center text-center box-border">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 6v12M6 12h12" />
                      </svg>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Songs</div>
                  </div>

                  <div className="w-full max-w-[140px] mx-auto rounded-2xl bg-white dark:bg-[#0b1220] p-3 sm:p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col items-center text-center box-border">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">Corrections</div>
                  </div>
                </div>

                <div className="mt-auto md:mt-4 flex flex-col gap-4 w-full">
                  <div className="rounded-3xl bg-slate-900 dark:bg-[#232b3d] px-5 py-5 text-white shadow-xl w-full text-center">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Email us directly</div>
                    <a href="mailto:singuntothelord@gmail.com" className="mt-2 inline-block text-base font-semibold text-white break-words">singuntothelord@gmail.com</a>
                  </div>

                  <div className="rounded-2xl bg-white dark:bg-[#0b1220] p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 w-full">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Subscribe to updates</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get an email when new songs are added.</p>
                    <form onSubmit={handleSubscribe} className="mt-3">
                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={subscribeEmail}
                          onChange={(e) => setSubscribeEmail(e.target.value)}
                          aria-invalid={!subscribeValid && subscribeEmail.length > 0}
                          className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#232b3d] px-4 py-2 text-sm outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                        <button
                          type="submit"
                          disabled={subscribeLoading || !subscribeValid}
                          className="w-full sm:w-auto rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                        >
                          {subscribeLoading ? "Subscribing..." : "Subscribe"}
                        </button>
                      </div>
                      {subscribeEmail.length > 0 && !subscribeValid ? (
                        <p className="mt-2 text-sm text-rose-600">Enter a valid email address.</p>
                      ) : subscribeError ? (
                        <p className="mt-2 text-sm text-rose-600">{subscribeError}</p>
                      ) : subscribeSuccess ? (
                        <p className="mt-2 text-sm text-emerald-700">{subscribeSuccess}</p>
                      ) : null}
                    </form>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right / form column */}
            <main className="md:col-span-7 p-2 md:p-4">
              <div className="bg-[var(--desktop-panel)] rounded-[1.25rem] p-4 md:p-6">
                <div className="mx-auto w-full max-w-xl">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">Contact Form</h2>
                  <p className="mt-2 text-slate-600 dark:text-slate-300 leading-7">Let us know your request or feedback below.</p>

                  {submitted ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-5 text-center font-semibold text-green-800 shadow-sm dark:border-emerald-800/70 dark:bg-emerald-950/55 dark:text-emerald-200 mt-4">
                      <p>Thank you — we received your message and will reply soon.</p>
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitted(false);
                            setSubmitError("");
                            setErrors({});
                          }}
                          className="transform cursor-pointer rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-green-800 shadow transition hover:scale-105 dark:bg-emerald-100 dark:text-emerald-950"
                        >
                          Send another request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">Name <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            onKeyDown={handleNameKeyDown}
                            maxLength={CONTACT_NAME_MAX}
                            placeholder="Enter your name"
                            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#232b3d] px-4 py-4 text-base outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-[#232b3d] focus:ring-4 focus:ring-blue-100"
                          />
                          <div className="mt-2 flex justify-between text-xs">
                            <span className="text-rose-500">{errors.name}</span>
                            <span className="text-slate-400 dark:text-slate-500">{form.name.length}/{CONTACT_NAME_MAX}</span>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">Email <span className="text-rose-500">*</span></label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            maxLength={CONTACT_EMAIL_MAX}
                            placeholder="you@example.com"
                            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#232b3d] px-4 py-4 text-base outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-[#232b3d] focus:ring-4 focus:ring-blue-100"
                          />
                          <div className="mt-2 flex justify-between text-xs">
                            <span className="text-rose-500">{errors.email}</span>
                            <span className="text-slate-400 dark:text-slate-500">{form.email.length}/{CONTACT_EMAIL_MAX}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">Type of request</label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {CONTACT_REQUEST_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              className={`rounded-2xl border px-4 py-3 text-sm font-semibold text-left transition-all cursor-pointer
                                ${form.type === type
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-400 dark:text-blue-300'
                                  : 'bg-white border-slate-200 text-slate-700 dark:bg-[#232b3d] dark:border-slate-700 dark:text-slate-200'}`}
                              onClick={() => setForm((prev) => ({ ...prev, type }))}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">Message <span className="text-rose-500">*</span></label>
                        <textarea
                          name="message"
                          rows={6}
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Share the song name, language, correction details, or any suggestion you have..."
                          maxLength={CONTACT_MESSAGE_MAX}
                          className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#232b3d] px-4 py-4 text-base outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-[#232b3d] focus:ring-4 focus:ring-blue-100"
                        />

                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                          <span className="text-rose-500">{errors.message}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-slate-400 dark:text-slate-500">{form.message.length}/{CONTACT_MESSAGE_MAX}</span>
                            <span>Please avoid sharing sensitive personal information.</span>
                          </div>
                        </div>
                      </div>

                      {submitError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                          {submitError}
                        </div>
                      ) : null}

                      <label className="flex items-start gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-4 text-sm text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-200 dark:ring-emerald-700 cursor-pointer">
                        <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} className="mt-1 h-4 w-4 rounded border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:bg-[#232b3d] cursor-pointer" />
                        <span>I agree to be contacted about this request if more details are needed.</span>
                      </label>

                      <label className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-[#0f1720] px-4 py-4 text-sm text-slate-800 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer">
                        <input type="checkbox" name="subscribe" checked={Boolean(form.subscribe)} onChange={handleChange} className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 dark:bg-[#232b3d] cursor-pointer" />
                        <span>Subscribe to receive updates on new songs</span>
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Response time: usually within a few days</p>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 dark:bg-[#0e2a43] px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl hover:bg-blue-700 dark:hover:bg-[#0b2336] cursor-pointer whitespace-nowrap"
                        >
                          {submitting ? <span className="whitespace-nowrap">Sending...</span> : <><span className="hidden md:inline whitespace-nowrap">Send message</span><span className="md:hidden whitespace-nowrap">Send</span></>}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}
