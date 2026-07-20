'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DateIdea,
  DateStatus,
  Season,
  SEASON_EMOJI,
  SEASON_LABELS,
  STATUS_LABELS,
} from '@/lib/types';
import { exportDates, importDates, loadDates, resetToDefaults, saveDates } from '@/lib/storage';

type FilterSeason = Season | 'all';
type FilterStatus = DateStatus | 'all';

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter', 'anytime'];
const STATUSES: DateStatus[] = ['wishlist', 'planned', 'completed'];

const emptyForm = (): Omit<DateIdea, 'id'> => ({
  title: '',
  description: '',
  season: 'anytime',
  status: 'wishlist',
  notes: '',
  plannedFor: '',
});

export function DateBoard() {
  const [dates, setDates] = useState<DateIdea[]>([]);
  const [ready, setReady] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState<FilterSeason>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDates(loadDates());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveDates(dates);
  }, [dates, ready]);

  const filtered = useMemo(() => {
    return dates.filter((d) => {
      const seasonOk = seasonFilter === 'all' || d.season === seasonFilter;
      const statusOk = statusFilter === 'all' || d.status === statusFilter;
      return seasonOk && statusOk;
    });
  }, [dates, seasonFilter, statusFilter]);

  const grouped = useMemo(() => {
    const order: Season[] = ['spring', 'summer', 'fall', 'winter', 'anytime'];
    return order
      .map((season) => ({
        season,
        items: filtered.filter((d) => d.season === season),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  const stats = useMemo(
    () => ({
      total: dates.length,
      planned: dates.filter((d) => d.status === 'planned').length,
      completed: dates.filter((d) => d.status === 'completed').length,
    }),
    [dates]
  );

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEditForm = (date: DateIdea) => {
    setEditingId(date.id);
    setForm({
      title: date.title,
      description: date.description,
      season: date.season,
      status: date.status,
      notes: date.notes ?? '',
      plannedFor: date.plannedFor ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload: DateIdea = {
      id: editingId ?? crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description.trim(),
      season: form.season,
      status: form.status,
      notes: form.notes?.trim() || undefined,
      plannedFor: form.plannedFor?.trim() || undefined,
    };

    if (editingId) {
      setDates((prev) => prev.map((d) => (d.id === editingId ? payload : d)));
    } else {
      setDates((prev) => [payload, ...prev]);
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this date idea?')) return;
    setDates((prev) => prev.filter((d) => d.id !== id));
  };

  const handleStatusChange = (id: string, status: DateStatus) => {
    setDates((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  const handleExport = () => {
    const blob = new Blob([exportDates(dates)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'our-dates.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const imported = importDates(text);
      setDates(imported);
      alert('Dates imported successfully!');
    } catch {
      alert('Could not import that file. Please use a valid our-dates JSON export.');
    }
  };

  const handleReset = () => {
    if (!confirm('Reset to the original date ideas? Your edits will be lost.')) return;
    setDates(resetToDefaults());
  };

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-rose-200 border-t-rose-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.25em] text-rose-400">
          For us
        </p>
        <h1 className="font-serif text-4xl text-rose-950 sm:text-5xl md:text-6xl">
          Our Date Adventures
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-rose-900/70">
          A little list of moments we want to share — seasonal favorites, cozy plans, and
          adventures waiting for us.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <StatPill label="Ideas" value={stats.total} />
          <StatPill label="Planned" value={stats.planned} accent />
          <StatPill label="Completed" value={stats.completed} />
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-100 bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <FilterButton active={seasonFilter === 'all'} onClick={() => setSeasonFilter('all')}>
            All seasons
          </FilterButton>
          {SEASONS.map((season) => (
            <FilterButton
              key={season}
              active={seasonFilter === season}
              onClick={() => setSeasonFilter(season)}
            >
              {SEASON_EMOJI[season]} {SEASON_LABELS[season]}
            </FilterButton>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            All
          </FilterButton>
          {STATUSES.map((status) => (
            <FilterButton
              key={status}
              active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
            >
              {STATUS_LABELS[status]}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={() => setEditMode(!editMode)} className="btn-secondary">
          {editMode ? 'Done editing' : 'Edit dates'}
        </button>
        {editMode && (
          <>
            <button type="button" onClick={openAddForm} className="btn-primary">
              + Add a date
            </button>
            <button type="button" onClick={handleExport} className="btn-secondary">
              Export
            </button>
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="btn-secondary"
            >
              Import
            </button>
            <button type="button" onClick={handleReset} className="btn-ghost">
              Reset ideas
            </button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl border border-rose-100 bg-white p-6 shadow-lg"
        >
          <h2 className="mb-4 font-serif text-2xl text-rose-950">
            {editingId ? 'Edit date' : 'Add a new date'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-rose-800">Title</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input"
                placeholder="Christmas lights walk"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-rose-800">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input min-h-24"
                placeholder="What makes this date special?"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-rose-800">Season</span>
              <select
                value={form.season}
                onChange={(e) => setForm({ ...form, season: e.target.value as Season })}
                className="input"
              >
                {SEASONS.map((season) => (
                  <option key={season} value={season}>
                    {SEASON_EMOJI[season]} {SEASON_LABELS[season]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-rose-800">Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DateStatus })}
                className="input"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-rose-800">
                Planned for (optional)
              </span>
              <input
                type="date"
                value={form.plannedFor}
                onChange={(e) => setForm({ ...form, plannedFor: e.target.value })}
                className="input"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-rose-800">Notes (optional)</span>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="input"
                placeholder="Reservation ideas, inside jokes, etc."
              />
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" className="btn-primary">
              {editingId ? 'Save changes' : 'Add date'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-12">
        {grouped.length === 0 ? (
          <p className="text-center text-rose-800/60">No dates match these filters.</p>
        ) : (
          grouped.map(({ season, items }) => (
            <section key={season}>
              <div className="mb-5 flex items-center gap-3">
                <span className="text-3xl">{SEASON_EMOJI[season]}</span>
                <h2 className="font-serif text-3xl text-rose-950">{SEASON_LABELS[season]}</h2>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-sm text-rose-700">
                  {items.length}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((date) => (
                  <article
                    key={date.id}
                    className={`date-card ${statusClass(date.status)}`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="font-serif text-xl text-rose-950">{date.title}</h3>
                      <StatusBadge status={date.status} />
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-rose-900/75">
                      {date.description}
                    </p>
                    {date.plannedFor && (
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-rose-600">
                        Planned for {formatDate(date.plannedFor)}
                      </p>
                    )}
                    {date.notes && (
                      <p className="mb-4 rounded-lg bg-rose-50/80 px-3 py-2 text-sm italic text-rose-800/80">
                        {date.notes}
                      </p>
                    )}

                    {(editMode || date.status !== 'completed') && (
                      <div className="flex flex-wrap gap-2 border-t border-rose-100 pt-4">
                        {editMode ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditForm(date)}
                              className="btn-small"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(date.id)}
                              className="btn-small btn-danger"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <>
                            {date.status !== 'planned' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(date.id, 'planned')}
                                className="btn-small"
                              >
                                Mark planned
                              </button>
                            )}
                            {date.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(date.id, 'completed')}
                                className="btn-small btn-success"
                              >
                                We did it!
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <footer className="mt-16 border-t border-rose-100 pt-8 text-center text-sm text-rose-800/50">
        <p>Made with love · Your edits save automatically in this browser</p>
        <p className="mt-1">Use Export / Import to share the list between devices</p>
      </footer>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-full px-4 py-2 text-sm ${
        accent
          ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
          : 'bg-white/80 text-rose-800 ring-1 ring-rose-100'
      }`}
    >
      <span className="font-semibold">{value}</span> {label}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm transition ${
        active
          ? 'bg-rose-500 text-white shadow-sm'
          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: DateStatus }) {
  const styles = {
    wishlist: 'bg-amber-50 text-amber-800 ring-amber-200',
    planned: 'bg-rose-50 text-rose-700 ring-rose-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function statusClass(status: DateStatus): string {
  if (status === 'completed') return 'opacity-80';
  if (status === 'planned') return 'ring-2 ring-rose-200';
  return '';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
