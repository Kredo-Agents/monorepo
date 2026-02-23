'use client';

import { useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Check, Download, LayoutDashboard, Search, X } from 'lucide-react';
import LogoLoader from '@/components/LogoLoader';

export default function SkillsPage() {
  const { data: instances } = trpc.instances.list.useQuery();
  const activeInstance = instances?.[0];
  const { data: skills, isLoading } = trpc.skills.list.useQuery();
  const utils = trpc.useUtils();
  const { data: installedSkills } = trpc.skills.getInstalled.useQuery(
    { instanceId: activeInstance?.id ?? 0 },
    { enabled: Boolean(activeInstance?.id) }
  );

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const installMutation = trpc.skills.install.useMutation({
    onSuccess: () => utils.skills.getInstalled.invalidate(),
  });
  const uninstallMutation = trpc.skills.uninstall.useMutation({
    onSuccess: () => utils.skills.getInstalled.invalidate(),
  });

  const installedSkillIds = useMemo(() => {
    if (!installedSkills) return new Set<number>();
    return new Set(installedSkills.map((skill) => skill.skillId));
  }, [installedSkills]);

  const categories = useMemo(() => {
    if (!skills) return [];
    const cats = new Set(skills.map((s) => s.category || 'General'));
    return ['All', ...Array.from(cats).sort()];
  }, [skills]);

  const filteredSkills = useMemo(() => {
    let list = skills ?? [];
    if (activeCategory && activeCategory !== 'All') {
      list = list.filter((s) => (s.category || 'General') === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [skills, activeCategory, search]);

  const [pendingInstall, setPendingInstall] = useState<Set<number>>(new Set());
  const [pendingUninstall, setPendingUninstall] = useState<Set<number>>(new Set());

  const handleInstall = (skillId: number) => {
    if (!activeInstance) return;
    setPendingInstall((prev) => new Set(prev).add(skillId));
    installMutation.mutate(
      { instanceId: activeInstance.id, skillId },
      {
        onSettled: () =>
          setPendingInstall((prev) => {
            const next = new Set(prev);
            next.delete(skillId);
            return next;
          }),
      }
    );
  };

  const handleUninstall = (skillId: number) => {
    if (!activeInstance) return;
    setPendingUninstall((prev) => new Set(prev).add(skillId));
    uninstallMutation.mutate(
      { instanceId: activeInstance.id, skillId },
      {
        onSettled: () =>
          setPendingUninstall((prev) => {
            const next = new Set(prev);
            next.delete(skillId);
            return next;
          }),
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-2 pb-6 md:py-12 md:mt-4 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Skills
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Browse and install skills for your assistant.
        </p>
      </div>

      {/* Search bar — 16px font prevents iOS zoom on focus */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search skills..."
          className="w-full rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/60 pl-10 pr-10 py-3 text-[16px] sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-50/10 transition"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 active:scale-95 transition"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category filter pills — horizontal scroll on mobile */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = cat === 'All' ? !activeCategory : activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat === 'All' ? null : cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors active:scale-95 ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <LogoLoader text="Loading skills..." className="py-12" />
      )}

      {/* Empty state */}
      {!isLoading && filteredSkills.length === 0 && (
        <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-900/40 p-10 text-center">
          <LayoutDashboard className="h-8 w-8 mx-auto mb-3 text-zinc-400 dark:text-zinc-600" aria-hidden="true" />
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {search || activeCategory ? 'No matching skills' : 'No skills found'}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            {search || activeCategory
              ? 'Try adjusting your search or filter.'
              : 'Skills will appear here when available.'}
          </p>
          {(search || activeCategory) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setActiveCategory(null); }}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 active:scale-[0.97] transition"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Skills grid */}
      {filteredSkills.length > 0 && (
        <div className="grid gap-3 md:gap-4 md:grid-cols-2">
          {filteredSkills.map((skill, i) => {
            const isInstalled = installedSkillIds.has(skill.id);
            const isInstalling = pendingInstall.has(skill.id);
            const isUninstalling = pendingUninstall.has(skill.id);
            const busy = isInstalling || isUninstalling;

            return (
              <div
                key={skill.id}
                className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-900/40 p-5 transition-all animate-fade-in"
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 leading-snug">
                      {skill.displayName}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-2">
                      {skill.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800/60 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        {skill.category || 'General'}
                      </span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-600">
                        {skill.provider || 'Custom'}
                      </span>
                    </div>
                  </div>

                  {/* Install / Installed button — min 44px touch target */}
                  {isInstalled || isUninstalling ? (
                    <button
                      onClick={() => handleUninstall(skill.id)}
                      disabled={busy}
                      className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 active:scale-[0.97] transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      {isUninstalling ? (
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                      )}
                      {isUninstalling ? 'Removing...' : 'Installed'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInstall(skill.id)}
                      disabled={busy}
                      className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 active:scale-[0.97] transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      {isInstalling ? (
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white dark:border-zinc-900/40 dark:border-t-zinc-900 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {isInstalling ? 'Installing...' : 'Install'}
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
