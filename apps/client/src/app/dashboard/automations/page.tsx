'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Play,
  Plus,
  Power,
  PowerOff,
  Trash2,
  X,
} from 'lucide-react';
import LogoLoader from '@/components/LogoLoader';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleKind = 'at' | 'every' | 'cron';
type EveryUnit = 'minutes' | 'hours' | 'days';

type CronSchedule =
  | { kind: 'at'; at: string }
  | { kind: 'every'; everyMs: number }
  | { kind: 'cron'; expr: string; tz?: string };

type CronJob = {
  jobId: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: CronSchedule;
  sessionTarget: 'main' | 'isolated';
  payload: { kind: string; text?: string; message?: string };
  deleteAfterRun?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function humanizeSchedule(schedule: CronSchedule): string {
  if (schedule.kind === 'at') {
    const d = new Date(schedule.at);
    return `Once · ${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (schedule.kind === 'every') {
    const ms = schedule.everyMs;
    if (ms < 60_000) return `Every ${ms / 1000} seconds`;
    if (ms === 60_000) return 'Every minute';
    if (ms < 3_600_000) return `Every ${Math.round(ms / 60_000)} minutes`;
    if (ms === 3_600_000) return 'Every hour';
    if (ms < 86_400_000) return `Every ${Math.round(ms / 3_600_000)} hours`;
    if (ms === 86_400_000) return 'Every day';
    return `Every ${Math.round(ms / 86_400_000)} days`;
  }
  if (schedule.kind === 'cron') {
    return schedule.tz ? `${schedule.expr} (${schedule.tz})` : schedule.expr;
  }
  return 'Unknown';
}

function everyMsFromWizard(amount: number, unit: EveryUnit): number {
  if (unit === 'minutes') return amount * 60_000;
  if (unit === 'hours') return amount * 3_600_000;
  return amount * 86_400_000;
}

// ─── Wizard defaults ──────────────────────────────────────────────────────────

const defaultWizard = {
  step: 1 as 1 | 2,
  name: '',
  message: '',
  scheduleKind: 'every' as ScheduleKind,
  atDatetime: '',
  everyAmount: 1,
  everyUnit: 'hours' as EveryUnit,
  cronExpr: '0 9 * * *',
  cronTz: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizard, setWizard] = useState(defaultWizard);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: instances } = trpc.instances.list.useQuery();
  const activeInstance = instances?.[0];
  const instanceId = activeInstance?.id ?? 0;

  const { data: jobs, isLoading } = trpc.automations.list.useQuery(
    { instanceId },
    { enabled: Boolean(instanceId), refetchInterval: 15_000 }
  );

  const addMutation = trpc.automations.add.useMutation({
    onSuccess: () => {
      utils.automations.list.invalidate();
      setWizardOpen(false);
      setWizard(defaultWizard);
    },
  });

  const toggleMutation = trpc.automations.toggle.useMutation({
    onSuccess: () => utils.automations.list.invalidate(),
  });

  const removeMutation = trpc.automations.remove.useMutation({
    onSuccess: () => {
      utils.automations.list.invalidate();
      setDeletingJobId(null);
    },
  });

  const runMutation = trpc.automations.run.useMutation({
    onSuccess: () => utils.automations.list.invalidate(),
  });

  // ── Wizard submit ────────────────────────────────────────────────────────

  function buildSchedule(): CronSchedule {
    if (wizard.scheduleKind === 'at') {
      return { kind: 'at', at: new Date(wizard.atDatetime).toISOString() };
    }
    if (wizard.scheduleKind === 'every') {
      return { kind: 'every', everyMs: everyMsFromWizard(wizard.everyAmount, wizard.everyUnit) };
    }
    return { kind: 'cron', expr: wizard.cronExpr.trim(), ...(wizard.cronTz.trim() ? { tz: wizard.cronTz.trim() } : {}) };
  }

  function handleSubmit() {
    if (!instanceId || !wizard.name.trim() || !wizard.message.trim()) return;
    addMutation.mutate({
      instanceId,
      name: wizard.name.trim(),
      schedule: buildSchedule(),
      sessionTarget: 'main',
      payload: { kind: 'agentTurn', message: wizard.message.trim() },
    });
  }

  function step1Valid() {
    return wizard.name.trim().length > 0 && wizard.message.trim().length > 0;
  }

  function step2Valid() {
    if (wizard.scheduleKind === 'at') return Boolean(wizard.atDatetime);
    if (wizard.scheduleKind === 'every') return wizard.everyAmount > 0;
    return wizard.cronExpr.trim().length > 0;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-14 pb-24 md:pt-12 md:pb-12 md:mt-4 animate-fade-in min-h-[calc(100dvh-10rem)] flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Automations
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Schedule tasks your assistant runs automatically.
          </p>
        </div>
        {Boolean(instanceId) && (
          <button
            onClick={() => { setWizard(defaultWizard); setWizardOpen(true); }}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-[0.97] transition-all min-h-[44px]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">New automation</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>


      {/* Loading */}
      {Boolean(instanceId) && isLoading && (
        <LogoLoader text="Loading automations..." className="py-12 my-auto" />
      )}

      {/* Empty state */}
      {Boolean(instanceId) && !isLoading && jobs?.length === 0 && (
        <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-8 sm:p-10 text-center my-auto">
          <CalendarClock className="h-8 w-8 mx-auto mb-3 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No automations yet</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">Create one to have your assistant run tasks on a schedule.</p>
          <button
            onClick={() => { setWizard(defaultWizard); setWizardOpen(true); }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-[0.97] transition-all min-h-[44px]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New automation
          </button>
        </div>
      )}

      {/* Jobs list */}
      {jobs && jobs.length > 0 && (
        <div className="space-y-3">
          {(jobs as CronJob[]).map((job, i) => {
            const isExpanded = expandedJob === job.jobId;
            const isDeleting = deletingJobId === job.jobId;
            const payloadPreview = job.payload.kind === 'agentTurn'
              ? job.payload.message
              : job.payload.text;

            return (
              <div
                key={job.jobId}
                className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 animate-fade-in"
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                {/* Card header — tappable to expand on mobile */}
                <button
                  type="button"
                  onClick={() => setExpandedJob(isExpanded ? null : job.jobId)}
                  className="w-full text-left px-4 sm:px-5 py-4 flex items-center gap-3 sm:gap-4"
                >
                  {/* Enabled dot */}
                  <span
                    className={`shrink-0 h-2.5 w-2.5 rounded-full ${job.enabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    title={job.enabled ? 'Enabled' : 'Disabled'}
                  />

                  {/* Name + schedule */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                      {job.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                      {humanizeSchedule(job.schedule)}
                    </p>
                  </div>

                  {/* Expand chevron */}
                  <span className="shrink-0 text-zinc-400">
                    {isExpanded
                      ? <ChevronUp className="h-4 w-4" aria-hidden="true" />
                      : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                  </span>
                </button>

                {/* Expanded detail + actions */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800/70">
                    {/* Message preview */}
                    <div className="px-4 sm:px-5 pt-4 pb-3 space-y-3">
                      {job.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{job.description}</p>
                      )}
                      <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/70 px-4 py-3">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Message to assistant</p>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">{payloadPreview}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                          {job.sessionTarget === 'main' ? 'Main session' : 'Isolated session'}
                        </span>
                        {job.deleteAfterRun && (
                          <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                            Runs once then deletes
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons — stacked on mobile for large touch targets */}
                    <div className="px-4 sm:px-5 pb-4 pt-1">
                      {isDeleting ? (
                        /* Delete confirmation */
                        <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 p-4">
                          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-3">
                            Delete "{job.name}"?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => removeMutation.mutate({ instanceId, jobId: job.jobId })}
                              disabled={removeMutation.isPending}
                              className="flex-1 sm:flex-none rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 active:scale-[0.97] transition-all disabled:opacity-50 min-h-[44px]"
                            >
                              {removeMutation.isPending ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                              onClick={() => setDeletingJobId(null)}
                              className="flex-1 sm:flex-none rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 active:scale-[0.97] transition-all min-h-[44px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal actions */
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => toggleMutation.mutate({ instanceId, jobId: job.jobId, enabled: !job.enabled })}
                            disabled={toggleMutation.isPending}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 active:scale-[0.97] transition-all disabled:opacity-50 min-h-[44px]"
                          >
                            {job.enabled
                              ? <><PowerOff className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="hidden sm:inline">Disable</span></>
                              : <><Power className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="hidden sm:inline">Enable</span></>}
                            <span className="sm:hidden">{job.enabled ? 'Disable' : 'Enable'}</span>
                          </button>

                          <button
                            onClick={() => runMutation.mutate({ instanceId, jobId: job.jobId })}
                            disabled={runMutation.isPending}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 active:scale-[0.97] transition-all disabled:opacity-50 min-h-[44px]"
                          >
                            <Play className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">Run now</span>
                            <span className="sm:hidden">Run</span>
                          </button>

                          <button
                            onClick={() => setDeletingJobId(job.jobId)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-800/50 active:scale-[0.97] transition-all min-h-[44px]"
                          >
                            <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="hidden sm:inline">Delete</span>
                            <span className="sm:hidden">Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create wizard ─ bottom sheet on mobile, centered modal on desktop ── */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setWizardOpen(false)}
            aria-label="Close"
          />

          {/* Panel — full-width bottom sheet on mobile, centered card on desktop */}
          <div className="relative w-full sm:max-w-lg sm:mx-4 rounded-t-2xl sm:rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900 shadow-xl max-h-[90dvh] overflow-y-auto overscroll-contain">

            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-5 sm:px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">New automation</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Step {wizard.step} of 2</p>
              </div>
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 active:scale-[0.97] transition-all"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Step progress bar */}
            <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-1 bg-zinc-900 dark:bg-zinc-50 transition-all duration-300"
                style={{ width: wizard.step === 1 ? '50%' : '100%' }}
              />
            </div>

            {/* Step 1: Name + message */}
            {wizard.step === 1 && (
              <div className="px-5 sm:px-6 py-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Morning briefing"
                    value={wizard.name}
                    onChange={e => setWizard(w => ({ ...w, name: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-3 text-[16px] sm:text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-50/20 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    What should your assistant do?
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Summarise the latest news and send it to me."
                    value={wizard.message}
                    onChange={e => setWizard(w => ({ ...w, message: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-3 text-[16px] sm:text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-50/20 transition resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Schedule */}
            {wizard.step === 2 && (
              <div className="px-5 sm:px-6 py-6 space-y-5">
                {/* Schedule kind tabs */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Frequency
                  </label>
                  <div className="flex rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    {(['every', 'at', 'cron'] as ScheduleKind[]).map((kind) => {
                      const labels = { every: 'Repeating', at: 'Once', cron: 'Custom' };
                      return (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => setWizard(w => ({ ...w, scheduleKind: kind }))}
                          className={`flex-1 py-3 text-sm font-medium transition-colors ${
                            wizard.scheduleKind === kind
                              ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 active:bg-zinc-100 dark:active:bg-zinc-800'
                          }`}
                        >
                          {labels[kind]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Once: datetime picker */}
                {wizard.scheduleKind === 'at' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Date & time
                    </label>
                    <input
                      type="datetime-local"
                      value={wizard.atDatetime}
                      onChange={e => setWizard(w => ({ ...w, atDatetime: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-3 text-[16px] sm:text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-50/20 transition"
                    />
                  </div>
                )}

                {/* Repeating: number + unit */}
                {wizard.scheduleKind === 'every' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Repeat every
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={wizard.everyAmount}
                        onChange={e => setWizard(w => ({ ...w, everyAmount: Math.max(1, Number(e.target.value)) }))}
                        className="w-24 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-3 text-[16px] sm:text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-50/20 transition"
                      />
                      <select
                        value={wizard.everyUnit}
                        onChange={e => setWizard(w => ({ ...w, everyUnit: e.target.value as EveryUnit }))}
                        className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-3 text-[16px] sm:text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-50/20 transition"
                      >
                        <option value="minutes">minutes</option>
                        <option value="hours">hours</option>
                        <option value="days">days</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Custom: cron expression + timezone */}
                {wizard.scheduleKind === 'cron' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Cron expression
                      </label>
                      <input
                        type="text"
                        placeholder="0 9 * * 1-5"
                        value={wizard.cronExpr}
                        onChange={e => setWizard(w => ({ ...w, cronExpr: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-3 text-[16px] sm:text-sm font-mono text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-50/20 transition"
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                        5 or 6 fields · min hour day month weekday [second]
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Timezone <span className="font-normal text-zinc-400">(optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="America/New_York"
                        value={wizard.cronTz}
                        onChange={e => setWizard(w => ({ ...w, cronTz: e.target.value }))}
                        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/60 px-3.5 py-3 text-[16px] sm:text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-50/20 transition"
                      />
                    </div>
                  </div>
                )}

                {/* Preview */}
                {step2Valid() && (
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/70 px-4 py-3">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">Preview</p>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      {humanizeSchedule(buildSchedulePreview(wizard))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Footer buttons — safe area padding on mobile */}
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 px-5 sm:px-6 py-4 safe-area-bottom">
              <button
                type="button"
                onClick={() => wizard.step === 1 ? setWizardOpen(false) : setWizard(w => ({ ...w, step: 1 }))}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 active:scale-[0.97] transition-all min-h-[44px]"
              >
                {wizard.step === 1 ? 'Cancel' : 'Back'}
              </button>

              {wizard.step === 1 ? (
                <button
                  type="button"
                  onClick={() => setWizard(w => ({ ...w, step: 2 }))}
                  disabled={!step1Valid()}
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!step2Valid() || addMutation.isPending}
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-[0.97] transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {addMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              )}
            </div>

            {/* Error */}
            {addMutation.error && (
              <div className="px-5 sm:px-6 pb-4 text-sm text-red-600 dark:text-red-400">
                {addMutation.error.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper used only inside the wizard for the preview
function buildSchedulePreview(wizard: typeof defaultWizard): CronSchedule {
  if (wizard.scheduleKind === 'at') {
    return { kind: 'at', at: wizard.atDatetime ? new Date(wizard.atDatetime).toISOString() : new Date().toISOString() };
  }
  if (wizard.scheduleKind === 'every') {
    return { kind: 'every', everyMs: everyMsFromWizard(wizard.everyAmount, wizard.everyUnit) };
  }
  return { kind: 'cron', expr: wizard.cronExpr.trim(), ...(wizard.cronTz.trim() ? { tz: wizard.cronTz.trim() } : {}) };
}
