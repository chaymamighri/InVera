import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const contactCards = [
  {
    title: 'Email',
    value: 'contact@invera.app',
    description: 'Use this for general information, product questions, and partnership requests.',
  },
  {
    title: 'Support',
    value: 'support@invera.app',
    description: 'Use this for technical help, onboarding support, and account assistance.',
  },
  {
    title: 'Phone',
    value: '+216 00 000 000',
    description: 'Use this for direct contact once your business phone number is ready.',
  },
];

const ContactUsPage = () => {
  return (
    <div className="min-h-screen bg-[#f3f4ef] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[34px] border border-white/80 bg-white/90 p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 p-2">
                <img src={logo} alt="InVera logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Contact Us</p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
                  Keep communication direct, professional, and easy to reach.
                </h1>
              </div>
            </div>

            <Link
              to="/login"
              className="inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Login
            </Link>
          </div>
        </header>

        <main className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[34px] border border-[#d7deea] bg-[linear-gradient(160deg,#0f172a_0%,#12243b_48%,#15314a_100%)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">Support experience</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-white">
              Ready for your real support details and business contact channels.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-300">
              This page is now a real route in the app. You can replace the placeholder contact data
              below with your actual company email, phone, WhatsApp, support links, or booking flow.
            </p>
          </section>

          <section className="grid gap-4">
            {contactCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">{card.title}</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ContactUsPage;
