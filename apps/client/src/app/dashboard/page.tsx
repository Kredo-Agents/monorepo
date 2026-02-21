'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { User, ArrowUp, ChevronDown } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UserAvatar from '@/components/auth/UserAvatar';
import CreditPopover from '@/components/dashboard/CreditPopover';

type ModelOption = { id: 'premium' | 'cheap'; name: string; badge?: string };

const MODEL_OPTIONS: ModelOption[] = [
  { id: 'premium', name: 'Claude Opus 4.6' },
  { id: 'cheap', name: 'Step 3.5 Flash', badge: 'Fast' },
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
              onClick={() => { onChange(model.id); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                model.id === selected
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <span>{model.name}</span>
              {model.badge && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
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

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
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
      <div className="h-screen flex flex-col items-center justify-center px-6 animate-fade-in">
        <div className="absolute top-4 left-4">
          <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <CreditPopover />
          <UserAvatar size="sm" />
        </div>
        <h1 className="text-4xl md:text-5xl font-light text-zinc-400 dark:text-zinc-500 mb-10 text-center">
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

        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {suggestionChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setInputValue(chip.prompt);
                textareaRef.current?.focus();
              }}
              className="rounded-full border border-zinc-200/70 dark:border-zinc-800/70 bg-white/60 dark:bg-zinc-900/40 px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <ModelSelector selected={selectedModel} onChange={setSelectedModel} />
        <div className="flex items-center gap-3">
          <CreditPopover />
          <UserAvatar size="sm" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" ref={listRef}>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {isLoading && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading assistant...</div>
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
              <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {message.role === 'user' ? (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
                    <User className="h-5 w-5" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-2">
                    <img src="/logo-footer.png" alt="Assistant" className="h-full w-full object-contain" />
                  </div>
                )}
                <div
                  className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${
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
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-2">
                    <img src="/logo-footer.png" alt="Assistant" className="h-full w-full object-contain" />
                  </div>
                <div className="inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed bg-white text-zinc-900 dark:bg-zinc-900/60 dark:text-zinc-100 border border-zinc-200/70 dark:border-zinc-800/70">
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

      <div className="px-6 py-4">
        <div className="max-w-3xl mx-auto rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 px-4 py-3 shadow-sm">
          <textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Send a message..."
            rows={3}
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
      </div>
    </div>
  );
}
