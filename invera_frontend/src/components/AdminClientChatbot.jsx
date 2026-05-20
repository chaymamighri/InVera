import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ClockIcon,
  PaperAirplaneIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import chatbotService from '../services/chatbotService';

const copyByLanguage = {
  fr: {
    title: 'Assistant InVera',
    subtitle: 'Admin client',
    placeholder: 'Posez votre question...',
    empty: 'Bonjour. Je peux consulter vos ventes, achats, factures, stock, clients et fournisseurs.',
    error: "Impossible d'obtenir une reponse",
    history: 'Historique',
    newChat: 'Nouveau chat',
    newChatTitle: 'Nouvelle conversation',
    noHistory: 'Aucune conversation',
    clearChat: 'Supprimer',
    typing: 'Analyse en cours...',
    suggestions: [
      "Combien de commandes ventes aujourd'hui ?",
      'Commandes fournisseurs ce mois',
      'Factures non payees',
      'Produits en rupture',
    ],
  },
  en: {
    title: 'InVera Assistant',
    subtitle: 'Client admin',
    placeholder: 'Ask your question...',
    empty: 'Hi. I can check your sales, purchases, invoices, stock, clients, and suppliers.',
    error: 'Unable to get an answer',
    history: 'History',
    newChat: 'New chat',
    newChatTitle: 'New conversation',
    noHistory: 'No conversations',
    clearChat: 'Delete',
    typing: 'Analyzing...',
    suggestions: [
      'How many sales orders today?',
      'Supplier orders this month',
      'Unpaid invoices',
      'Out of stock products',
    ],
  },
  ar: {
    title: 'مساعد InVera',
    subtitle: 'مسؤول العميل',
    placeholder: 'اكتب سؤالك...',
    empty: 'مرحبا. يمكنني مراجعة المبيعات والمشتريات والفواتير والمخزون والعملاء والموردين.',
    error: 'تعذر الحصول على إجابة',
    history: 'السجل',
    newChat: 'محادثة جديدة',
    newChatTitle: 'محادثة جديدة',
    noHistory: 'لا توجد محادثات',
    clearChat: 'حذف',
    typing: 'جار التحليل...',
    suggestions: [
      'كم عدد طلبات المبيعات اليوم؟',
      'طلبات الموردين هذا الشهر',
      'الفواتير غير المدفوعة',
      'منتجات نفدت من المخزون',
    ],
  },
};

const quickId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const HISTORY_LIMIT = 12;
const MIN_PANEL_WIDTH = 360;
const MAX_PANEL_WIDTH = 760;
const DEFAULT_PANEL_WIDTH = 440;

const getHistoryStorageKey = () => {
  const clientId = localStorage.getItem('clientId') || sessionStorage.getItem('clientId');
  const email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
  return `invera-admin-chatbot-history:${clientId || email || 'current'}`;
};

const createSession = (title = copyByLanguage.fr.newChatTitle) => {
  const now = new Date().toISOString();
  return {
    id: quickId(),
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
};

const isSessionEmpty = (session) => !session?.messages?.length;

const keepOnlyOneEmptySession = (sessions, activeSessionId) => {
  const activeSession = sessions.find((session) => session.id === activeSessionId);
  const emptySessionToKeep = isSessionEmpty(activeSession)
    ? activeSession
    : sessions.find((session) => isSessionEmpty(session));

  return sessions.filter((session) => !isSessionEmpty(session) || session.id === emptySessionToKeep?.id);
};

const loadHistory = (emptySessionTitle = copyByLanguage.fr.newChatTitle) => {
  try {
    const raw = localStorage.getItem(getHistoryStorageKey());
    if (!raw) {
      const session = createSession(emptySessionTitle);
      return { sessions: [session], activeSessionId: session.id };
    }

    const parsed = JSON.parse(raw);
    const validSessions = Array.isArray(parsed?.sessions)
      ? parsed.sessions.filter((session) => session?.id)
      : [];

    if (!validSessions.length) {
      const session = createSession(emptySessionTitle);
      return { sessions: [session], activeSessionId: session.id };
    }

    const activeSessionId = parsed.activeSessionId || validSessions[0].id;
    const sessions = keepOnlyOneEmptySession(validSessions, activeSessionId).slice(0, HISTORY_LIMIT);

    return {
      sessions,
      activeSessionId: sessions.some((session) => session.id === activeSessionId) ? activeSessionId : sessions[0].id,
    };
  } catch {
    const session = createSession(emptySessionTitle);
    return { sessions: [session], activeSessionId: session.id };
  }
};

const saveHistory = (sessions, activeSessionId) => {
  localStorage.setItem(
    getHistoryStorageKey(),
    JSON.stringify({
      activeSessionId,
      sessions: sessions.slice(0, HISTORY_LIMIT),
    }),
  );
};

const formatSessionDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getStoredPanelWidth = () => {
  const savedWidth = Number(localStorage.getItem('invera-admin-chatbot-width'));
  if (!Number.isFinite(savedWidth)) return DEFAULT_PANEL_WIDTH;
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, savedWidth));
};

const AdminClientChatbot = () => {
  const { language } = useLanguage();
  const text = copyByLanguage[language] || copyByLanguage.fr;
  const [initialHistory] = useState(() => loadHistory(text.newChatTitle));
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState(initialHistory.sessions);
  const [activeSessionId, setActiveSessionId] = useState(initialHistory.activeSessionId);
  const [panelWidth, setPanelWidth] = useState(getStoredPanelWidth);
  const [resizing, setResizing] = useState(false);
  const scrollRef = useRef(null);
  const activeSession = sessions.find((session) => session.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];
  const activeChatIsEmpty = messages.length === 0;

  const persistSessions = (nextSessions, nextActiveSessionId = activeSessionId) => {
    setSessions(nextSessions);
    setActiveSessionId(nextActiveSessionId);
    saveHistory(nextSessions, nextActiveSessionId);
  };

  const updateActiveMessages = (updater) => {
    setSessions((currentSessions) => {
      const nextSessions = currentSessions.map((session) => {
        if (session.id !== activeSessionId) return session;

        const nextMessages = typeof updater === 'function' ? updater(session.messages || []) : updater;
        const firstUserMessage = nextMessages.find((message) => message.role === 'user')?.content;

        return {
          ...session,
          title: firstUserMessage ? firstUserMessage.slice(0, 48) : session.title,
          updatedAt: new Date().toISOString(),
          messages: nextMessages,
        };
      });

      const sortedSessions = [...nextSessions].sort(
        (first, second) => new Date(second.updatedAt) - new Date(first.updatedAt),
      );
      saveHistory(sortedSessions, activeSessionId);
      return sortedSessions;
    });
  };

  const startNewChat = useCallback(() => {
    const session = createSession(text.newChatTitle);
    setSessions((currentSessions) => {
      const currentActiveSession = currentSessions.find((item) => item.id === activeSessionId) || currentSessions[0];

      if (!currentActiveSession?.messages?.length) {
        const existingSessionId = currentActiveSession?.id || session.id;
        const compactSessions = keepOnlyOneEmptySession(
          currentSessions.length ? currentSessions : [session],
          existingSessionId,
        );
        setActiveSessionId(existingSessionId);
        saveHistory(compactSessions, existingSessionId);
        return compactSessions;
      }

      const nextSessions = keepOnlyOneEmptySession([session, ...currentSessions], session.id).slice(0, HISTORY_LIMIT);
      setActiveSessionId(session.id);
      saveHistory(nextSessions, session.id);
      return nextSessions;
    });
    setViewMode('chat');
    setInput('');
    scrollToBottom();
  }, [activeSessionId, text.newChatTitle]);

  const selectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    saveHistory(sessions, sessionId);
    setViewMode('chat');
    scrollToBottom();
  };

  const deleteActiveSession = () => {
    const remainingSessions = sessions.filter((session) => session.id !== activeSession?.id);
    const nextSessions = remainingSessions.length ? remainingSessions : [createSession(text.newChatTitle)];
    persistSessions(nextSessions, nextSessions[0].id);
    setViewMode('chat');
    setInput('');
  };

  const suggestions = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
    return lastAssistant?.suggestions?.length ? lastAssistant.suggestions : text.suggestions;
  }, [messages, text.suggestions]);

  const scrollToBottom = () => {
    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  };

  const sendMessage = async (value = input) => {
    const question = value.trim();
    if (!question || loading) return;

    const userMessage = {
      id: quickId(),
      role: 'user',
      content: question,
    };

    updateActiveMessages((current) => [...current, userMessage]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      const result = await chatbotService.sendMessage(question, language);
      const assistantMessage = {
        id: quickId(),
        role: 'assistant',
        content: result?.answer || '',
        intent: result?.intent,
        period: result?.period,
        data: result?.data,
        suggestions: result?.suggestions || [],
      };
      updateActiveMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      toast.error(error?.response?.data?.message || text.error);
      updateActiveMessages((current) => [
        ...current,
        {
          id: quickId(),
          role: 'assistant',
          content: text.error,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const openAssistant = () => {
      startNewChat();
      setOpen(true);
    };
    window.addEventListener('invera-admin-chatbot:open', openAssistant);
    return () => window.removeEventListener('invera-admin-chatbot:open', openAssistant);
  }, [startNewChat]);

  useEffect(() => {
    if (!resizing) return undefined;

    const updateWidth = (clientX) => {
      const viewportWidth = window.innerWidth || DEFAULT_PANEL_WIDTH;
      const maxWidth = Math.min(MAX_PANEL_WIDTH, viewportWidth - 24);
      const nextWidth = Math.min(maxWidth, Math.max(MIN_PANEL_WIDTH, viewportWidth - clientX));
      setPanelWidth(nextWidth);
      localStorage.setItem('invera-admin-chatbot-width', String(nextWidth));
    };

    const handlePointerMove = (event) => {
      event.preventDefault();
      updateWidth(event.clientX);
    };

    const handleTouchMove = (event) => {
      const touch = event.touches?.[0];
      if (touch) updateWidth(touch.clientX);
    };

    const stopResize = () => setResizing(false);

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', stopResize);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopResize);
    };
  }, [resizing]);

  return (
    <>
      <div
        className={`fixed inset-y-0 right-0 z-[9100] max-w-[100vw] transform border-l border-blue-100 bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `min(100vw, ${panelWidth}px)` }}
        aria-hidden={!open}
      >
        <div
          role="separator"
          aria-orientation="vertical"
          title="Resize"
          onPointerDown={(event) => {
            event.preventDefault();
            setResizing(true);
          }}
          onTouchStart={(event) => {
            event.preventDefault();
            setResizing(true);
          }}
          className="absolute inset-y-0 left-0 z-20 w-2 cursor-ew-resize touch-none transition-colors hover:bg-cyan-400/25"
        />
        <div className="flex h-full flex-col bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="flex min-h-[76px] items-center justify-between border-b border-blue-500/20 bg-gradient-to-r from-blue-700 to-blue-800 px-5 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-tight">{text.title}</h2>
                <p className="text-xs text-blue-100">{text.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode((current) => (current === 'history' ? 'chat' : 'history'))}
                className="rounded-lg p-2 text-blue-100 transition-colors hover:bg-white/15 hover:text-white"
                aria-label={text.history}
                title={text.history}
              >
                <ClockIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={startNewChat}
                disabled={activeChatIsEmpty}
                className="rounded-lg p-2 text-blue-100 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-blue-100"
                aria-label={text.newChat}
                title={text.newChat}
              >
                <PlusIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-blue-100 transition-colors hover:bg-white/15 hover:text-white"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {viewMode === 'history' ? (
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-800">{text.history}</h3>
                <button
                  type="button"
                  onClick={deleteActiveSession}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  {text.clearChat}
                </button>
              </div>

              <div className="space-y-2">
                {sessions.length === 0 && (
                  <p className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-500 shadow-sm">{text.noHistory}</p>
                )}
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => selectSession(session.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left shadow-sm transition-all ${
                      session.id === activeSession?.id
                        ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50'
                        : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    <p className="truncate text-sm font-semibold text-gray-800">{session.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatSessionDate(session.updatedAt)}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
                {messages.length === 0 && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-6 text-gray-600 shadow-sm">
                    {text.empty}
                  </div>
                )}

                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                          message.role === 'user'
                            ? 'rounded-br-md bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                            : message.isError
                              ? 'rounded-bl-md border border-red-100 bg-red-50 text-red-700'
                              : 'rounded-bl-md border border-gray-200 bg-white text-gray-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.role === 'assistant' && (message.intent || message.period) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
                            {message.intent && (
                              <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{message.intent}</span>
                            )}
                            {message.period && (
                              <span className="rounded-full bg-cyan-50 px-2 py-1 text-cyan-700">{message.period}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                          {text.typing}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 bg-white p-4 shadow-[0_-8px_20px_rgba(15,23,42,0.04)]">
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                  {suggestions.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendMessage(suggestion)}
                      disabled={loading}
                      className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <div className="flex items-end gap-2 rounded-xl border border-gray-300 bg-gray-50 p-2 shadow-sm focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={text.placeholder}
                    className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300"
                    aria-label="Send"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-[9050] hidden bg-slate-950/20 backdrop-blur-[1px] md:block"
          onClick={() => setOpen(false)}
          aria-label="Close assistant overlay"
        />
      )}
    </>
  );
};

export default AdminClientChatbot;
