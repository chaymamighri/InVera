import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

const pageConfig = {
  support: {
    eyebrow: 'Support placeholder',
    title: 'Contact Us placeholder',
    description:
      'Connect this route to your contact form, support center, demo request flow, or team details.',
  },
  about: {
    eyebrow: 'About placeholder',
    title: 'About Us placeholder',
    description:
      'Connect this route to your brand story, mission, product vision, and team presentation.',
  },
};

const PublicInfoPage = ({ type = 'about' }) => {
  const config = pageConfig[type] || pageConfig.about;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-6 py-10">
      <div className="mx-auto max-w-4xl rounded-[36px] border border-white/60 bg-white/90 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.10)] backdrop-blur md:p-12">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 p-2">
            <img src={logo} alt="InVera logo" className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              {config.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{config.title}</h1>
          </div>
        </div>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-600">{config.description}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="rounded-full bg-slate-950 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Back to Welcome
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-slate-950 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicInfoPage;
