'use client';

import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Check, Download } from 'lucide-react';

export default function SkillsPage() {
  const { data: instances } = trpc.instances.list.useQuery();
  const activeInstance = instances?.[0];
  const { data: skills, isLoading } = trpc.skills.list.useQuery();
  const { data: installedSkills } = trpc.skills.getInstalled.useQuery(
    { instanceId: activeInstance?.id ?? 0 },
    { enabled: Boolean(activeInstance?.id) }
  );

  const installMutation = trpc.skills.install.useMutation();
  const uninstallMutation = trpc.skills.uninstall.useMutation();

  const installedSkillIds = useMemo(() => {
    if (!installedSkills) return new Set<number>();
    return new Set(installedSkills.map((skill) => skill.skillId));
  }, [installedSkills]);

  const filteredSkills = useMemo(() => skills ?? [], [skills]);

  const handleInstall = (skillId: number) => {
    if (!activeInstance) return;
    installMutation.mutate({ instanceId: activeInstance.id, skillId });
  };

  const handleUninstall = (skillId: number) => {
    if (!activeInstance) return;
    uninstallMutation.mutate({ instanceId: activeInstance.id, skillId });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 mt-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Skills
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Browse and install skills for your assistant.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Loading skills...</div>
      )}

      {!isLoading && filteredSkills.length === 0 && (
        <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-900/40 p-6 text-sm text-zinc-600 dark:text-zinc-400">
          No skills found.
        </div>
      )}

      {filteredSkills.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSkills.map((skill) => {
            const isInstalled = installedSkillIds.has(skill.id);
            return (
              <div
                key={skill.id}
                className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {skill.displayName}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                      {skill.description || 'No description'}
                    </p>
                    <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                      {skill.category || 'General'} · {skill.provider || 'Custom'}
                    </div>
                  </div>
                  {isInstalled ? (
                    <button
                      onClick={() => handleUninstall(skill.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Installed
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInstall(skill.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      Install
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
