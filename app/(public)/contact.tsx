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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-0 overflow-hidden rounded-[32px] bg-white dark:bg-[#101624] shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:shadow-[0_20px_60px_rgba(15,23,42,0.32)] transition-colors mt-4 sm:mt-0">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left content */}
        <section className="relative px-5 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-12 bg-gradient-to-br from-white via-emerald-50/40 to-blue-50/60 dark:from-[#101624] dark:via-[#18213a] dark:to-[#1a2236] transition-colors">
                <div className="max-w-xl text-center ">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 dark:bg-blue-400/10 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-400 mb-5">
                    We would love to hear from you
                  </div>
    
                  <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-tight text-center sm:text-left">
                    Thank you for visiting
                    <span className="block text-blue-600 dark:text-blue-400">our song library</span>
                  </h1>

                  <p className="mt-6 text-base sm:text-lg leading-8 text-slate-600 dark:text-slate-300 max-w-2xl text-center sm:text-left">
                    Share your feedback, suggest corrections, or request new songs. Every message helps us improve the collection and make it more useful for everyone.
                  </p>

                  <div className="mt-8 grid gap-4 grid-cols-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white dark:bg-[#0b1220] p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col items-center text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mx-auto">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                      <path d="M8 10h8M8 14h5" />
                      <path d="M6 5h12a2 2 0 0 1 2 2v11l-4-3H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                    </svg>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-[1rem] sm:text-lg">Feedback</div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-[#0b1220] p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col items-center text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mx-auto">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 6v12M6 12h12" />
                    </svg>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-[1rem] sm:text-lg">Songs</div>
                </div>

                <div className="rounded-2xl bg-white dark:bg-[#0b1220] p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 flex flex-col items-center text-center">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mx-auto">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white text-[1rem] sm:text-lg truncate whitespace-nowrap">Corrections</div>
                </div>
              </div>
       
                  <div className="mt-8 rounded-3xl bg-slate-900 dark:bg-[#232b3d] px-5 py-5 sm:px-6 sm:py-6 text-white shadow-xl">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Email us directly</div>
                        <a href="mailto:singuntothelord@gmail.com" className="mt-1 inline-block text-base sm:text-md font-semibold text-white dark:text-blue-200 break-all hover:text-emerald-300 dark:hover:text-emerald-300">
                          singuntothelord@gmail.com
                        </a>
                      </div>
                      <a
                        href="mailto:singuntothelord.contact@gmail.com"
                        className="hidden sm:inline-flex items-center justify-center rounded-2xl bg-white dark:bg-[#181f2e] px-5 py-3 text-sm font-semibold text-slate-900 dark:text-white shadow-lg transform hover:translate-y-[-1px] hover:scale-105 hover:shadow-xl transition dark:hover:bg-[#0b2336] cursor-pointer"
                        tabIndex={0}
                      >
                        Contact us
                      </a>
                    </div>
                  </div>
                  {/* Subscribe card (left side) */}
                  <div className="mt-6 rounded-2xl bg-white dark:bg-[#0b1220] p-4 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Subscribe to updates</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get an email when new songs are added.</p>
                    <form onSubmit={handleSubscribe} className="mt-3">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={subscribeEmail}
                          onChange={(e) => setSubscribeEmail(e.target.value)}
                          aria-invalid={!subscribeValid && subscribeEmail.length > 0}
                          className="flex-1 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#232b3d] px-4 py-2 text-sm outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                        <button
                          type="submit"
                          disabled={subscribeLoading || !subscribeValid}
                          className="rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
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
              </section>
    
              {/* Right form */}
              <section className="bg-white dark:bg-[#181f2e] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-12 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 transition-colors">
                <div className="mx-auto max-w-xl">
                  <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">Contact Form</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-300 leading-7">
                      Let us know your request or feedback below.
                    </p>
                  </div>
    
                  {submitted ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-5 text-center font-semibold text-green-800 shadow-sm dark:border-emerald-800/70 dark:bg-emerald-950/55 dark:text-emerald-200">
                      <p>Thank you — we received your message and will reply soon.</p>
                      <div className="mt-4 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSubmitted(false);
                            setSubmitError("");
                            setErrors({});
                          }}
                          className="transform cursor-pointer rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-green-800 shadow transition hover:scale-105 dark:bg-emerald-100 dark:text-emerald-950 dark:hover:bg-emerald-200"
                        >
                          Send another request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                  : 'bg-white border-slate-200 text-slate-700 dark:bg-[#232b3d] dark:border-slate-700 dark:text-slate-200'}
                            `}
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
                        <span>
                          I agree to be contacted about this request if more details are needed.
                        </span>
                      </label>

                      {/* Inline subscribe checkbox (added to contact form) */}
                      <label className="flex items-start gap-3 rounded-2xl bg-slate-50 dark:bg-[#0f1720] px-4 py-4 text-sm text-slate-800 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer">
                        <input type="checkbox" name="subscribe" checked={Boolean(form.subscribe)} onChange={handleChange} className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 dark:bg-[#232b3d] cursor-pointer" />
                        <span>
                          Subscribe to receive updates on new songs
                        </span>
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Response time: usually within a few days</p>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 dark:bg-[#0e2a43] px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl hover:bg-blue-700 dark:hover:bg-[#0b2336] cursor-pointer whitespace-nowrap"
                        >
                          {submitting ? (
                            <span className="whitespace-nowrap">Sending...</span>
                          ) : (
                            <>
                              <span className="hidden md:inline whitespace-nowrap">Send message</span>
                              <span className="md:hidden whitespace-nowrap">Send</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </section>
            </div>
    
    </div>
  );
}
