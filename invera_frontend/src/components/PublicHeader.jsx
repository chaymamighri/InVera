import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/images/logo.png';
import LanguageSwitcher from './LanguageSwitcher';

const PublicHeader = ({
  title,
  subtitle = 'InVera ERP',
  backTo = '/welcome',
  backLabel,
  actions,
}) => {
  return (
    <header className="rounded-[28px] border border-sky-100 bg-white px-5 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b2f6b] p-2">
            <img src={logo} alt="InVera logo" className="max-h-full max-w-full object-contain" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#0b4ea2]">
              {subtitle}
            </p>
            <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <LanguageSwitcher
            className="self-start sm:self-auto"
            menuClassName="z-[100]"
            variant="light"
          />
          {actions}
          {backLabel ? (
            <Link
              to={backTo}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {backLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
