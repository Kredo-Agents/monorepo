'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Bot, Send, User } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        history: nextHistory,
      });
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || 'No response returned.',
      };
      setMessages((prev) => [...prev, assistantMessage]);
      // Refresh credit balance in sidebar after message
      void utils.credits.balance.invalidate();
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

  return (
    <div className="h-screen flex flex-col">
      <div ref={listRef} className="flex-1 overflow-y-auto px-8 py-8 space-y-6 pb-24">
        {isLoading && (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">Loading assistant...</div>
        )}
        {!isLoading && activeInstance && messages.length === 0 && (
          <div className="max-w-2xl rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-900/40 p-6 text-sm text-zinc-600 dark:text-zinc-400">
            Say hello to your agent and start the conversation.
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-3xl ${
              message.role === 'user'
                ? 'ml-auto text-right'
                : 'mr-auto text-left'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  message.role === 'user'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Bot className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                )}
              </div>
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
          <div className="max-w-3xl mr-auto text-left">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-blue-600 text-white">
                <Bot className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
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

      <div className="sticky bottom-0 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="flex-1 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 px-4 py-3 shadow-sm">
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Send a message..."
              rows={1}
              className="w-full resize-none bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none"
              disabled={!activeInstance || isSending}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="inline-flex items-center justify-center h-11 w-11 rounded-full bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
