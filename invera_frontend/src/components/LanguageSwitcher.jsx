import React, { useEffect, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';

const VARIANT_CLASSES = {
  dark: 'border-white/20 bg-white/10 text-white hover:bg-white/15',
  light: 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-sky-300 hover:text-sky-700',
};

const LanguageSwitcher = ({ className = '', menuClassName = '', variant = 'dark' }) => {
  const { language, options, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, []);

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.dark}`}
        aria-label={t('common.language')}
      >
        <GlobeAltIcon className="h-5 w-5" />
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${menuClassName}`}
        >
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            {t('common.language')}
          </div>
          <div className="p-2">
            {options.map((option) => {
              const selected = option.code === language;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={async () => {
                    await setLanguage(option.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                    selected
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {selected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold">
                      <CheckIcon className="h-4 w-4" />
                      {t('common.selected')}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
