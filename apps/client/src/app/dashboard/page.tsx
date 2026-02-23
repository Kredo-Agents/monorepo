'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { User, ArrowUp, ChevronDown } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UserAvatar from '@/components/auth/UserAvatar';
import CreditPopover from '@/components/dashboard/CreditPopover';
import LogoLoader from '@/components/LogoLoader';

type ModelOption = { id: string; name: string; badge?: string; disabled?: boolean };

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'premium', name: 'Gemini 2.5 Flash' },
  { id: 'cheap', name: 'Step 3.5 Flash', badge: 'Soon', disabled: true },
  { id: 'claude-sonnet', name: 'Claude Sonnet 4.6', badge: 'Soon', disabled: true },
  { id: 'deepseek-r1', name: 'DeepSeek R1', badge: 'Soon', disabled: true },
  { id: 'claude-opus', name: 'Claude Opus 4.6', badge: 'Soon', disabled: true },
];

function ModelSelector({
  selected,
  onChange,
}: {
  selected: 'premium' | 'cheap';
  onChange: (model: 'premium' | 'cheap') => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = MODEL_OPTIONS.find((m) => m.id === selected) || MODEL_OPTIONS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
      >
        {current.name}
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 z-50">
          {MODEL_OPTIONS.map((model) => (
            <button
              key={model.id}
              type="button"
              disabled={model.disabled}
              onClick={() => { if (!model.disabled) { onChange(model.id as 'premium' | 'cheap'); setOpen(false); } }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                model.disabled
                  ? 'opacity-50 cursor-not-allowed text-zinc-400 dark:text-zinc-600'
                  : model.id === selected
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span>{model.name}</span>
              {model.badge && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  model.disabled
                    ? 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-600'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                }`}>
                  {model.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const suggestionChips = [
  { label: 'Say hello', prompt: 'Hello! What can you do?' },
  { label: 'Set your persona', prompt: 'I want to configure your personality. ' },
  { label: 'Ask a question', prompt: '' },
  { label: 'Explore skills', prompt: 'What skills do you have installed?' },
];

const welcomeCards = [
  {
    title: 'Personalize your Agent',
    description: 'Shape how your agent thinks, responds, and interacts with you.',
    prompt: 'I want to configure your personality and preferences.',
    svg: (
      <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Profile card */}
        <rect x="10" y="12" width="100" height="66" rx="8" className="fill-zinc-200/60 dark:fill-zinc-700/40" />
        <rect x="18" y="20" width="84" height="50" rx="5" className="fill-white/80 dark:fill-zinc-800/60" />
        {/* Avatar circle */}
        <circle cx="42" cy="40" r="12" className="fill-zinc-300 dark:fill-zinc-600" />
        <circle cx="42" cy="36" r="5" className="fill-zinc-400 dark:fill-zinc-500" />
        <ellipse cx="42" cy="47" rx="8" ry="5" className="fill-zinc-400 dark:fill-zinc-500" />
        {/* Text lines */}
        <rect x="60" y="32" width="34" height="4" rx="2" className="fill-zinc-300 dark:fill-zinc-600" />
        <rect x="60" y="40" width="26" height="3" rx="1.5" className="fill-zinc-200 dark:fill-zinc-700" />
        <rect x="60" y="47" width="30" height="3" rx="1.5" className="fill-zinc-200 dark:fill-zinc-700" />
        {/* Sparkle accents */}
        <path d="M96 18l2 4 2-4-2-4z" className="fill-amber-400/70 dark:fill-amber-300/50" />
        <path d="M16 60l1.5 3 1.5-3-1.5-3z" className="fill-blue-400/70 dark:fill-blue-300/50" />
      </svg>
    ),
  },
  {
    title: 'Explore the Skill Store',
    description: 'Install skills to give your agent new abilities and superpowers.',
    prompt: 'What skills are available in the skill store?',
    svg: (
      <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Puzzle piece - main shape */}
        <path d="M30 25h20v8a6 6 0 1012 0v-8h20v20h-8a6 6 0 100 12h8v20H62v-8a6 6 0 10-12 0v8H30V57h8a6 6 0 000-12h-8V25z"
          className="fill-indigo-200/80 dark:fill-indigo-700/40 stroke-indigo-400 dark:stroke-indigo-500" strokeWidth="2" />
        {/* Download arrow on puzzle */}
        <path d="M56 40v12M51 47l5 5 5-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-indigo-600 dark:stroke-indigo-300" />
        {/* Small floating pieces */}
        <rect x="88" y="14" width="16" height="16" rx="4" className="fill-emerald-200/70 dark:fill-emerald-800/40" />
        <rect x="88" y="36" width="16" height="16" rx="4" className="fill-amber-200/70 dark:fill-amber-800/40" />
        <rect x="88" y="58" width="16" height="16" rx="4" className="fill-rose-200/70 dark:fill-rose-800/40" />
        {/* Dots inside small blocks */}
        <circle cx="96" cy="22" r="2.5" className="fill-emerald-500/60 dark:fill-emerald-400/50" />
        <circle cx="96" cy="44" r="2.5" className="fill-amber-500/60 dark:fill-amber-400/50" />
        <circle cx="96" cy="66" r="2.5" className="fill-rose-500/60 dark:fill-rose-400/50" />
      </svg>
    ),
  },
  {
    title: 'Automate your Workflow',
    description: 'Schedule tasks and let your agent work for you around the clock.',
    prompt: 'Help me set up an automation to run on a schedule.',
    svg: (
      <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Clock face */}
        <circle cx="52" cy="45" r="30" strokeWidth="3" className="stroke-zinc-300 dark:stroke-zinc-600 fill-white/50 dark:fill-zinc-800/40" />
        <circle cx="52" cy="45" r="2" className="fill-zinc-500 dark:fill-zinc-400" />
        {/* Hour hand */}
        <line x1="52" y1="45" x2="52" y2="26" strokeWidth="3" strokeLinecap="round" className="stroke-zinc-600 dark:stroke-zinc-300" />
        {/* Minute hand */}
        <line x1="52" y1="45" x2="66" y2="38" strokeWidth="2" strokeLinecap="round" className="stroke-zinc-400 dark:stroke-zinc-500" />
        {/* Tick marks */}
        <line x1="52" y1="17" x2="52" y2="20" strokeWidth="2" strokeLinecap="round" className="stroke-zinc-400 dark:stroke-zinc-500" />
        <line x1="52" y1="70" x2="52" y2="73" strokeWidth="2" strokeLinecap="round" className="stroke-zinc-400 dark:stroke-zinc-500" />
        <line x1="24" y1="45" x2="27" y2="45" strokeWidth="2" strokeLinecap="round" className="stroke-zinc-400 dark:stroke-zinc-500" />
        <line x1="77" y1="45" x2="80" y2="45" strokeWidth="2" strokeLinecap="round" className="stroke-zinc-400 dark:stroke-zinc-500" />
        {/* Circular arrow (repeat/automation) */}
        <path d="M90 28a22 22 0 01-2 32" strokeWidth="2.5" strokeLinecap="round" className="stroke-emerald-500 dark:stroke-emerald-400" fill="none" />
        <path d="M86 60l2.5-4.5 4.5 1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-emerald-500 dark:stroke-emerald-400" fill="none" />
        <path d="M100 26l-10 2" strokeWidth="2" strokeLinecap="round" className="stroke-emerald-500 dark:stroke-emerald-400" fill="none" />
        <path d="M100 26l-2 5" strokeWidth="2" strokeLinecap="round" className="stroke-emerald-500 dark:stroke-emerald-400" fill="none" />
        {/* Lightning bolt accent */}
        <path d="M102 44l-4 6h5l-4 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-amber-400 dark:stroke-amber-300" fill="none" />
      </svg>
    ),
  },
];

function WelcomeCarousel({ onCardClick }: { onCardClick: (prompt: string) => void }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % welcomeCards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mt-6 md:mt-8">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/60 dark:bg-zinc-900/40 shadow-sm cursor-pointer"
        onClick={() => onCardClick(welcomeCards[active].prompt)}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {welcomeCards.map((card, i) => (
            <div key={i} className="w-full flex-shrink-0 flex items-center justify-between px-5 py-5 md:px-7 md:py-6 gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm md:text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  {card.title}
                </h3>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {card.description}
                </p>
              </div>
              <div className="w-20 h-16 md:w-28 md:h-20 flex-shrink-0 opacity-80">
                {card.svg}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Carousel dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {welcomeCards.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active
                ? 'w-4 bg-zinc-600 dark:bg-zinc-400'
                : 'w-1.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-600'
            }`}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatHistoryMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type StoredChatMessage = ChatHistoryMessage & {
  id: number;
};

const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal pl-5">{children}</ol>,
  li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
  a: ({ children, ...props }) => (
    <a className="underline underline-offset-4" target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/10">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded bg-black/10 p-3 text-xs dark:bg-white/10">
      {children}
    </pre>
  ),
};

export default function DashboardPage() {
  const { data: instances, isLoading } = trpc.instances.list.useQuery();
  const activeInstance = instances?.[0];
  const historyQuery = trpc.chat.history.useQuery(
    { instanceId: activeInstance?.id ?? 0, limit: 200 },
    { enabled: Boolean(activeInstance) }
  );
  const utils = trpc.useUtils();
  const sendChatMutation = trpc.chat.send.useMutation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'premium' | 'cheap'>('premium');
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastInstanceIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeInstance?.id !== lastInstanceIdRef.current) {
      lastInstanceIdRef.current = activeInstance?.id ?? null;
      setMessages([]);
    }
  }, [activeInstance?.id]);

  const isNearBottom = useRef(true);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    isNearBottom.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  useEffect(() => {
    if (listRef.current && isNearBottom.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!activeInstance || !historyQuery.data || messages.length > 0) return;
    const hydrated = (historyQuery.data as StoredChatMessage[])
      .filter(
        (message): message is StoredChatMessage & { role: 'user' | 'assistant' } =>
          message.role !== 'system'
      )
      .map((message) => ({
        id: String(message.id),
        role: message.role,
        content: message.content,
      }));
    setMessages(hydrated);
  }, [activeInstance, historyQuery.data, messages.length]);

  const canSend =
    Boolean(activeInstance) && inputValue.trim().length > 0 && !isSending && !sendChatMutation.isPending;

  const historyPayload = useMemo<ChatHistoryMessage[]>(
    () =>
      messages.map((message) => ({
        role: message.role as ChatHistoryMessage['role'],
        content: message.content,
      })),
    [messages]
  );

  const handleSend = async () => {
    if (!activeInstance || !canSend) return;
    const trimmed = inputValue.trim();
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    isNearBottom.current = true;

    const nextHistory: ChatHistoryMessage[] = [
      ...historyPayload,
      { role: 'user', content: trimmed },
    ];

    try {
      const data = await sendChatMutation.mutateAsync({
        instanceId: activeInstance.id,
        message: trimmed,
        model: selectedModel,
        history: nextHistory,
      });
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'No response returned.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
      // Refresh credit balance after message
      void utils.credits.balance.invalidate();
      void utils.credits.planInfo.invalidate();
    } catch (error: any) {
      const msg = error?.message ?? '';
      const isInsufficientCredits = msg.includes('10003') || msg.includes('Insufficient credits');
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: isInsufficientCredits
            ? 'You do not have enough credits to send a message. Visit the Credits page to purchase more.'
            : msg || 'Failed to send message.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    void handleSend();
  };

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const showWelcome = !isLoading && activeInstance && messages.length === 0;

  if (showWelcome) {
    return (
      <div className="chat-fixed-mobile md:h-screen flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-black animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3">
          <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
          <div className="flex items-center gap-3">
            <CreditPopover />
            <span className="hidden md:block"><UserAvatar size="sm" /></span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4">
          <h1 className="text-3xl md:text-5xl font-light text-zinc-400 dark:text-zinc-500 mb-8 md:mb-10 text-center">
            Say hello to your agent
          </h1>

          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 shadow-sm px-4 py-3">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Send a message to your agent..."
              rows={2}
              className="w-full resize-none bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              disabled={!activeInstance || isSending}
            />
            <div className="flex items-center justify-end pt-1">
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
                aria-label="Send message"
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 md:mt-6">
            {suggestionChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => {
                  setInputValue(chip.prompt);
                  textareaRef.current?.focus();
                }}
                className="rounded-full border border-zinc-200/70 dark:border-zinc-800/70 bg-white/60 dark:bg-zinc-900/40 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <WelcomeCarousel onCardClick={(prompt) => {
            setInputValue(prompt);
            textareaRef.current?.focus();
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-fixed-mobile md:h-screen flex flex-col bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-black">
      <div className="flex items-center justify-between px-4 py-2 md:py-3">
        <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
        <div className="flex items-center gap-3">
          <CreditPopover />
          <span className="hidden md:block"><UserAvatar size="sm" /></span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" ref={listRef} onScroll={handleScroll}>
        <div className="max-w-3xl mx-auto px-3 md:px-6 py-4 md:py-8 space-y-4 md:space-y-6">
          {isLoading && (
            <LogoLoader text="Loading assistant..." className="py-12" />
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${
                message.role === 'user'
                  ? 'ml-auto text-right'
                  : 'mr-auto text-left'
              }`}
            >
              <div className={`flex items-start gap-2 md:gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {message.role === 'user' ? (
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center shrink-0 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
                    <User className="h-4 w-4 md:h-5 md:w-5" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-1.5 md:p-2">
                    <img src="/logo-footer.png" alt="Assistant" className="h-full w-full object-contain" />
                  </div>
                )}
                <div
                  className={`inline-block px-3 py-2 md:px-4 md:py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                      : 'bg-white text-zinc-900 dark:bg-zinc-900/60 dark:text-zinc-100 border border-zinc-200/70 dark:border-zinc-800/70'
                  }`}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isSending && activeInstance && (
            <div className="mr-auto text-left">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-1.5 md:p-2">
                    <img src="/logo-footer.png" alt="Assistant" className="h-full w-full object-contain" />
                  </div>
                <div className="inline-block px-3 py-2 md:px-4 md:py-3 rounded-2xl text-sm leading-relaxed bg-white text-zinc-900 dark:bg-zinc-900/60 dark:text-zinc-100 border border-zinc-200/70 dark:border-zinc-800/70">
                  <span className="dot-wave" aria-label="Assistant is responding">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 md:px-6 pt-2 pb-2 md:py-4 md:pb-4">
        <div className="max-w-3xl mx-auto rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 px-3 md:px-4 py-2 md:py-3 shadow-sm">
          <textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Send a message..."
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
            disabled={!activeInstance || isSending}
          />
          <div className="flex items-center justify-end pt-1">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
