"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "", type: "Song request", consent: true });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  const MAX_NAME = 40;
  const MAX_EMAIL = 60;
  const MAX_MESSAGE = 500;
  const REQUEST_TYPES = ["Song request", "Correction", "General feedback"];

  const validate = () => {
    const errs: { name?: string; email?: string; message?: string } = {};
    if (!form.name.trim()) {
      errs.name = "Name is required.";
    } else if (/\d/.test(form.name)) {
      errs.name = "Name cannot contain numbers.";
    } else if (form.name.length > MAX_NAME) {
      errs.name = `Name must be at most ${MAX_NAME} characters.`;
    }
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = "Enter a valid email address.";
    } else if (form.email.length > MAX_EMAIL) {
      errs.email = `Email must be at most ${MAX_EMAIL} characters.`;
    }
    if (!form.message.trim()) {
      errs.message = "Message is required.";
    } else if (form.message.length > MAX_MESSAGE) {
      errs.message = `Message must be at most ${MAX_MESSAGE} characters.`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // Here you would send the form data to your backend or email service
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-6xl overflow-hidden rounded-[32px] bg-white dark:bg-[#101624] shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:shadow-[0_20px_60px_rgba(15,23,42,0.32)] transition-colors mt-4 sm:mt-0">
      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left content */}
        <section className="relative px-5 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-12 bg-gradient-to-br from-white via-emerald-50/40 to-blue-50/60 dark:from-[#101624] dark:via-[#18213a] dark:to-[#1a2236] transition-colors">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 dark:bg-blue-400/10 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-400 mb-5">
                    <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
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
                        className="hidden sm:inline-flex items-center justify-center rounded-2xl bg-white dark:bg-blue-700 px-5 py-3 text-sm font-semibold text-slate-900 dark:text-white shadow-lg hover:translate-y-[-1px] transition"
                        tabIndex={0}
                      >
                        Contact us
                      </a>
                    </div>
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
                    <div className="rounded-xl bg-green-50 border border-green-200 px-6 py-5 text-center text-green-800 font-semibold shadow-sm">
                      Thank you — we received your message and will reply soon.
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
                            placeholder="Enter your name"
                            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#232b3d] px-4 py-4 text-base outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-[#232b3d] focus:ring-4 focus:ring-blue-100"
                          />
                          <div className="mt-2 flex justify-between text-xs">
                            <span className="text-rose-500">{errors.name}</span>
                            <span className="text-slate-400 dark:text-slate-500">{form.name.length}/{MAX_NAME}</span>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">Email <span className="text-rose-500">*</span></label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#232b3d] px-4 py-4 text-base outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-[#232b3d] focus:ring-4 focus:ring-blue-100"
                          />
                          <div className="mt-2 flex justify-between text-xs">
                            <span className="text-rose-500">{errors.email}</span>
                            <span className="text-slate-400 dark:text-slate-500">{form.email.length}/{MAX_EMAIL}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200">Type of request</label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {REQUEST_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              className={`rounded-2xl border px-4 py-3 text-sm font-semibold text-left transition-all
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
                          className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#232b3d] px-4 py-4 text-base outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-[#232b3d] focus:ring-4 focus:ring-blue-100"
                        />
                        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                          <span className="text-rose-500">{errors.message}</span>
                          <span>Please avoid sharing sensitive personal information.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 px-4 py-4 text-sm text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-200 dark:ring-emerald-700">
                        <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} className="mt-1 h-4 w-4 rounded border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:bg-[#232b3d]" />
                        <p>
                          I agree to be contacted about this request if more details are needed.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Response time: usually within a few days</p>
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 dark:bg-blue-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition hover:translate-y-[-1px] hover:shadow-xl hover:bg-blue-700 dark:hover:bg-blue-800"
                        >
                          Send message
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
