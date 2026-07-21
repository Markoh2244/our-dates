'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DateIdea,
  DateStatus,
  EventType,
  Season,
  EVENT_TYPE_LABELS,
  SEASON_EMOJI,
  SEASON_LABELS,
  STATUS_LABELS,
} from '@/lib/types';
import {
  clearStoredAccessCode,
  fetchCloudEvents,
  getStoredAccessCode,
  hydrateCalendar,
  saveCloudEvents,
  unlockCloud,
  uploadCloudPhoto,
} from '@/lib/cloud';
import { exportDates, importDates, resetToDefaults, saveDates } from '@/lib/storage';
import { CrossIcon, IchthysIcon } from './ChristianIcons';
import { ScriptureBanner } from './ScriptureBanner';

type FilterSeason = Season | 'all';
type FilterStatus = DateStatus | 'all';

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter', 'anytime'];
const STATUSES: DateStatus[] = ['wishlist', 'planned', 'completed'];
const EVENT_TYPES: EventType[] = [
  'service',
  'walk',
  'adventure',
  'family',
  'food',
  'travel',
  'learning',
  'milestone',
  'faith',
  'cozy',
];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type DateFormState = {
  title: string;
  description: string;
  season: Season;
  status: DateStatus;
  eventType: EventType;
  address: string;
  livNote: string;
  markoNote: string;
  plannedFor: string;
  imageDataUrl: string;
  imageName: string;
};

const emptyForm = (): DateFormState => ({
  title: '',
  description: '',
  season: 'anytime',
  status: 'wishlist',
  eventType: 'cozy',
  address: '',
  livNote: '',
  markoNote: '',
  plannedFor: '',
  imageDataUrl: '',
  imageName: '',
});

export function DateBoard() {
  const [dates, setDates] = useState<DateIdea[]>([]);
  const [ready, setReady] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [seasonFilter, setSeasonFilter] = useState<FilterSeason>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [form, setForm] = useState<DateFormState>(emptyForm());
  const [cloudEnabled, setCloudEnabled] = useState(false);
  const [cloudUnlocked, setCloudUnlocked] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const skipNextCloudSave = useRef(true);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hydrated = await hydrateCalendar();
      if (cancelled) return;

      setDates(hydrated.events);
      setCloudEnabled(hydrated.cloudEnabled);
      setCloudUnlocked(hydrated.cloudUnlocked);
      setAccessCodeInput(getStoredAccessCode());

      const nextDate = hydrated.events
        .filter((item) => item.plannedFor)
        .sort((a, b) => (a.plannedFor ?? '').localeCompare(b.plannedFor ?? ''))[0];
      if (nextDate?.plannedFor) {
        const date = new Date(`${nextDate.plannedFor}T12:00:00`);
        setMonthCursor(new Date(date.getFullYear(), date.getMonth(), 1));
      }

      setReady(true);
      setSyncMessage(
        hydrated.cloudUnlocked
          ? 'Cloud sync is on — our calendar persists for Liv and Marko.'
          : hydrated.cloudEnabled
            ? 'Cloud is ready. Enter our shared access code to unlock persistence.'
            : 'Saving on this device only until we connect free cloud storage.'
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveDates(dates);

    if (!cloudUnlocked) return;
    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }

    const code = getStoredAccessCode();
    if (!code) return;

    const timer = window.setTimeout(async () => {
      try {
        await saveCloudEvents(code, dates);
        setSyncMessage('Saved to the cloud.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Cloud save failed';
        setSyncMessage(message);
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [dates, ready, cloudUnlocked]);

  const filtered = useMemo(() => {
    return dates.filter((d) => {
      const seasonOk = seasonFilter === 'all' || d.season === seasonFilter;
      const statusOk = statusFilter === 'all' || d.status === statusFilter;
      return seasonOk && statusOk;
    });
  }, [dates, seasonFilter, statusFilter]);

  const monthDays = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalSlots = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

    return Array.from({ length: totalSlots }, (_, index) => {
      const dayNumber = index - startWeekday + 1;
      const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      const date = inMonth ? new Date(year, month, dayNumber) : null;
      return { date, inMonth };
    });
  }, [monthCursor]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, DateIdea[]>();
    filtered.forEach((item) => {
      if (!item.plannedFor) return;
      const key = item.plannedFor;
      const current = map.get(key) ?? [];
      current.push(item);
      map.set(key, current);
    });
    return map;
  }, [filtered]);

  const monthEvents = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    return filtered
      .filter((item) => {
        if (!item.plannedFor) return false;
        const date = new Date(`${item.plannedFor}T12:00:00`);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .sort((a, b) => (a.plannedFor ?? '').localeCompare(b.plannedFor ?? ''));
  }, [filtered, monthCursor]);

  const unscheduled = useMemo(
    () =>
      filtered
        .filter((item) => !item.plannedFor)
        .sort((a, b) => a.title.localeCompare(b.title)),
    [filtered]
  );

  const stats = useMemo(
    () => ({
      total: dates.length,
      planned: dates.filter((d) => d.status === 'planned').length,
      completed: dates.filter((d) => d.status === 'completed').length,
      withPhotos: dates.filter((d) => Boolean(d.imageDataUrl)).length,
    }),
    [dates]
  );

  const openAddForm = () => {
    setEditingId(null);
    setPendingPhotoFile(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openPlanForm = (isoDate: string) => {
    setEditingId(null);
    setPendingPhotoFile(null);
    setForm({
      ...emptyForm(),
      plannedFor: isoDate,
      status: 'planned',
    });
    setShowForm(true);
  };

  const openEditForm = (date: DateIdea) => {
    setEditingId(date.id);
    setPendingPhotoFile(null);
    setForm({
      title: date.title,
      description: date.description,
      season: date.season,
      status: date.status,
      eventType: date.eventType,
      address: date.address ?? '',
      livNote: date.livNote ?? '',
      markoNote: date.markoNote ?? '',
      plannedFor: date.plannedFor ?? '',
      imageDataUrl: date.imageDataUrl ?? '',
      imageName: date.imageName ?? '',
    });
    setShowForm(true);
  };

  const handleUnlockCloud = async () => {
    const ok = await unlockCloud(accessCodeInput.trim());
    if (!ok) {
      setSyncMessage('That access code did not work.');
      return;
    }

    try {
      skipNextCloudSave.current = true;
      const events = await fetchCloudEvents(accessCodeInput.trim());
      setDates(events);
      saveDates(events);
      setCloudUnlocked(true);
      setSyncMessage('Cloud unlocked. Our calendar will sync across devices.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not unlock cloud';
      setSyncMessage(message);
    }
  };

  const handleLockCloud = () => {
    clearStoredAccessCode();
    setCloudUnlocked(false);
    setSyncMessage('Cloud locked on this device. Local edits still save here.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const eventId = editingId ?? crypto.randomUUID();
    let payload: DateIdea = {
      id: eventId,
      title: form.title.trim(),
      description: form.description.trim(),
      season: form.season,
      status: form.status,
      eventType: form.eventType,
      address: optionalText(form.address),
      livNote: optionalText(form.livNote),
      markoNote: optionalText(form.markoNote),
      plannedFor: optionalText(form.plannedFor),
      imageDataUrl: optionalText(form.imageDataUrl),
      imageName: optionalText(form.imageName),
    };

    let nextDates: DateIdea[];
    if (editingId) {
      nextDates = dates.map((d) => (d.id === editingId ? payload : d));
    } else {
      nextDates = [payload, ...dates];
    }

    // Persist event first, then upload photo to free cloud storage if needed.
    if (cloudUnlocked && pendingPhotoFile) {
      try {
        setSavingImage(true);
        const code = getStoredAccessCode();
        skipNextCloudSave.current = true;
        await saveCloudEvents(code, nextDates);
        payload = await uploadCloudPhoto(code, eventId, pendingPhotoFile);
        nextDates = nextDates.map((d) => (d.id === eventId ? payload : d));
        setSyncMessage('Photo saved securely in the cloud.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Photo upload failed';
        setSyncMessage(message);
      } finally {
        setSavingImage(false);
      }
    }

    setDates(nextDates);
    setShowForm(false);
    setEditingId(null);
    setPendingPhotoFile(null);
    setForm(emptyForm());
  };

  const handleImageUpload = async (file: File) => {
    setSavingImage(true);
    try {
      setPendingPhotoFile(file);
      const optimized = await fileToOptimizedDataUrl(file);
      setForm((prev) => ({
        ...prev,
        imageDataUrl: optimized,
        imageName: file.name,
      }));
    } catch {
      alert('Could not process this image. Please try another one.');
    } finally {
      setSavingImage(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Remove this event from our calendar?')) return;
    setDates((prev) => prev.filter((d) => d.id !== id));
  };

  const handleStatusChange = (id: string, status: DateStatus) => {
    setDates((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  };

  const jumpToToday = () => {
    const now = new Date();
    setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const handleExport = () => {
    const blob = new Blob([exportDates(dates)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liv-and-marko-calendar.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const imported = importDates(text);
      setDates(imported);
      alert('Calendar imported successfully.');
    } catch {
      alert('Could not import that file. Please use a valid JSON export.');
    }
  };

  const handleReset = () => {
    if (!confirm('Reset to the hardcoded timeline? This removes our edits.')) return;
    skipNextCloudSave.current = !cloudUnlocked;
    setDates(resetToDefaults());
  };

  if (!ready) {
    return (
      <div className="romantic-bg flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
      </div>
    );
  }

  const activeSeason = getSeasonFromMonth(monthCursor.getMonth());

  return (
    <div className={`romantic-bg season-theme-${activeSeason}`}>
      <div className="floating-crosses" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="floating-cross" style={{ '--i': i } as React.CSSProperties}>
            ✝
          </span>
        ))}
      </div>
      <div key={activeSeason} className={`season-scene season-scene-${activeSeason}`} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="season-particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      <div className="relative z-1 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <ScriptureBanner />

        <header className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <CrossIcon className="text-gold" size={28} />
            <IchthysIcon className="text-gold opacity-80" size={24} />
            <CrossIcon className="text-gold" size={28} />
          </div>
          <div className="mb-3 flex justify-center">
            <span className="season-badge">
              {SEASON_EMOJI[activeSeason]} {SEASON_LABELS[activeSeason]} — walking together in faith
            </span>
          </div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.22em] text-muted">
            Liv + Marko
          </p>
          <h1 className="font-serif text-4xl text-ink sm:text-5xl">Our Memory Calendar</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted">
            We are building our story on Christ&apos;s love — our dates, places, photos, and notes
            gathered here as a testimony of His faithfulness.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <StatPill label="Events" value={stats.total} />
            <StatPill label="Planned" value={stats.planned} accent />
            <StatPill label="Done" value={stats.completed} />
            <StatPill label="Photos" value={stats.withPhotos} />
          </div>

          {cloudEnabled && (
            <div className="mx-auto mt-5 max-w-md panel p-3">
              {!cloudUnlocked ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <input
                    type="password"
                    value={accessCodeInput}
                    onChange={(e) => setAccessCodeInput(e.target.value)}
                    className="input max-w-[220px]"
                    placeholder="Shared access code"
                  />
                  <button type="button" className="btn-primary" onClick={handleUnlockCloud}>
                    Unlock cloud
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="text-sm text-muted">Cloud sync is on</span>
                  <button type="button" className="btn-small" onClick={handleLockCloud}>
                    Lock
                  </button>
                </div>
              )}
              {syncMessage && <p className="mt-2 text-xs text-muted">{syncMessage}</p>}
            </div>
          )}
          {!cloudEnabled && (
            <p className="mx-auto mt-4 max-w-xl text-xs text-muted">
              Cloud sync is not configured on this deployment yet. Add the Supabase variables from
              <code className="mx-1 rounded bg-white/70 px-1 py-0.5">.env.example</code>
              in Vercel to sync photos and events across devices.
            </p>
          )}
        </header>

        <div className="mb-5 toolbar panel p-3">
          <div className="filter-row">
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

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setEditMode(!editMode)} className="btn-secondary">
              {editMode ? 'Done' : 'Edit'}
            </button>
            {editMode && (
              <>
                <button type="button" onClick={openAddForm} className="btn-primary">
                  + Add
                </button>
                <button type="button" onClick={handleExport} className="btn-small">
                  Export
                </button>
                <button type="button" onClick={() => importRef.current?.click()} className="btn-small">
                  Import
                </button>
                <button type="button" onClick={handleReset} className="btn-ghost">
                  Reset
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
        </div>

        <div className="mb-5 filter-row panel p-3">
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

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 panel p-5 sm:p-6">
            <h2 className="mb-4 font-serif text-2xl text-ink">
              {editingId ? 'Edit event' : 'Add a new event'}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-ink">Title</span>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Our coffee date"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-ink">Our memory</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="input min-h-24"
                  placeholder="What happened and why this mattered to us"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Season</span>
                <select
                  value={form.season}
                  onChange={(e) => setForm((prev) => ({ ...prev, season: e.target.value as Season }))}
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
                <span className="mb-1 block text-sm font-medium text-ink">Status</span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value as DateStatus }))
                  }
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
                <span className="mb-1 block text-sm font-medium text-ink">
                  Event type <span className="font-normal text-muted">(sets color)</span>
                </span>
                <select
                  value={form.eventType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, eventType: e.target.value as EventType }))
                  }
                  className="input"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {EVENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Date</span>
                <input
                  type="date"
                  value={form.plannedFor}
                  onChange={(e) => setForm((prev) => ({ ...prev, plannedFor: e.target.value }))}
                  className="input"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-ink">Address</span>
                <input
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="input"
                  placeholder="Princeton University, Princeton, NJ"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Liv note</span>
                <input
                  value={form.livNote}
                  onChange={(e) => setForm((prev) => ({ ...prev, livNote: e.target.value }))}
                  className="input"
                  placeholder="Liv can add a note here"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Marko note</span>
                <input
                  value={form.markoNote}
                  onChange={(e) => setForm((prev) => ({ ...prev, markoNote: e.target.value }))}
                  className="input"
                  placeholder="Marko can add a note here"
                />
              </label>

              <div className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-ink">Photo (optional)</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="btn-small"
                    onClick={() => imageRef.current?.click()}
                    disabled={savingImage}
                  >
                    {savingImage ? 'Saving photo...' : 'Upload photo'}
                  </button>
                  {form.imageDataUrl && (
                    <button
                      type="button"
                      className="btn-small btn-danger"
                      onClick={() => {
                        setPendingPhotoFile(null);
                        setForm((prev) => ({ ...prev, imageDataUrl: '', imageName: '' }));
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                  {form.imageName && <span className="text-xs text-muted">{form.imageName}</span>}
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                </div>
                {form.imageDataUrl && (
                  <img
                    src={form.imageDataUrl}
                    alt="Event preview"
                    className="mt-3 h-44 w-full rounded-xl object-cover"
                    style={{ border: '1px solid var(--border)' }}
                  />
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button type="submit" className="btn-primary">
                {editingId ? 'Save changes' : 'Add event'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setPendingPhotoFile(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="mb-5 panel p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-2xl text-ink">
              {monthCursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-small"
                onClick={() =>
                  setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
              >
                Prev
              </button>
              <button type="button" className="btn-small" onClick={jumpToToday}>
                Today
              </button>
              <button
                type="button"
                className="btn-small"
                onClick={() =>
                  setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
              >
                Next
              </button>
            </div>
          </div>

          <div className="calendar-grid">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="calendar-weekday">
                {label}
              </div>
            ))}
            {monthDays.map(({ date, inMonth }, index) => {
              const isoDate = date ? formatIsoDate(date) : '';
              const dayEvents = isoDate ? eventsByDate.get(isoDate) ?? [] : [];
              const isToday = isoDate === formatIsoDate(new Date());

              return (
                <div
                  key={`${isoDate}-${index}`}
                  className={`calendar-day ${inMonth ? '' : 'calendar-day--muted'} ${
                    isToday ? 'calendar-day--today' : ''
                  }`}
                >
                  {date ? (
                    <>
                      <div className="calendar-day__header">
                        <span>{date.getDate()}</span>
                        {editMode && (
                          <button
                            type="button"
                            className="calendar-add"
                            onClick={() => openPlanForm(isoDate)}
                            aria-label={`Add event for ${isoDate}`}
                          >
                            +
                          </button>
                        )}
                      </div>
                      <div className="calendar-day__events">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            type="button"
                            key={event.id}
                            className={`calendar-event event-type-${event.eventType}`}
                            onClick={() => openEditForm(event)}
                            title={`${event.title} (${EVENT_TYPE_LABELS[event.eventType]})`}
                          >
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="calendar-more">+{dayEvents.length - 3} more</span>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-5 panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-xl text-ink">Our timeline this month</h3>
            <span className="season-badge">{monthEvents.length}</span>
          </div>
          {monthEvents.length === 0 ? (
            <p className="text-sm text-muted">We do not have anything scheduled this month yet.</p>
          ) : (
            <div className="space-y-3">
              {monthEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  editMode={editMode}
                  onEdit={() => openEditForm(event)}
                  onDelete={() => handleDelete(event.id)}
                  onMarkPlanned={() => handleStatusChange(event.id, 'planned')}
                  onMarkDone={() => handleStatusChange(event.id, 'completed')}
                />
              ))}
            </div>
          )}
        </section>

        <section className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif text-xl text-ink">Unscheduled ideas for us</h3>
            <span className="season-badge">{unscheduled.length}</span>
          </div>
          {unscheduled.length === 0 ? (
            <p className="text-sm text-muted">Everything is on our calendar right now.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {unscheduled.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  editMode={editMode}
                  onEdit={() => openEditForm(event)}
                  onDelete={() => handleDelete(event.id)}
                  onMarkPlanned={() => handleStatusChange(event.id, 'planned')}
                  onMarkDone={() => handleStatusChange(event.id, 'completed')}
                />
              ))}
            </div>
          )}
        </section>

        <footer
          className="mt-12 border-t pt-6 text-center text-sm text-muted"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="mb-2 flex items-center justify-center gap-2 text-gold">
            <CrossIcon size={16} />
            <span className="font-serif italic">Christ at the center of our love</span>
            <CrossIcon size={16} />
          </div>
          <p>Made with love for Liv and Marko, to the glory of God.</p>
        </footer>
      </div>
    </div>
  );
}

function EventCard({
  event,
  editMode,
  onEdit,
  onDelete,
  onMarkPlanned,
  onMarkDone,
}: {
  event: DateIdea;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMarkPlanned: () => void;
  onMarkDone: () => void;
}) {
  return (
    <article className={`date-card event-card event-type-${event.eventType}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="font-serif text-lg text-ink">{event.title}</h4>
        <StatusBadge status={event.status} />
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <EventTypeBadge type={event.eventType} />
        {event.plannedFor && (
          <span className="season-badge py-1!">{formatDate(event.plannedFor)}</span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted">{event.description}</p>

      {event.address && (
        <p className="mt-3 text-sm text-ink">
          <span className="font-semibold">Address:</span>{' '}
          <a href={mapLink(event.address)} target="_blank" rel="noreferrer" className="underline">
            {event.address}
          </a>
        </p>
      )}

      {event.imageDataUrl && (
        <img
          src={event.imageDataUrl}
          alt={event.title}
          className="mt-3 h-44 w-full rounded-xl object-cover"
          style={{ border: '1px solid var(--border)' }}
        />
      )}

      {event.livNote && (
        <p className="mt-3 rounded-lg px-3 py-2 text-sm text-ink" style={{ background: 'var(--accent-soft)' }}>
          <span className="font-semibold">Liv note:</span> {event.livNote}
        </p>
      )}
      {event.markoNote && (
        <p className="mt-2 rounded-lg px-3 py-2 text-sm text-ink" style={{ background: 'var(--accent-soft)' }}>
          <span className="font-semibold">Marko note:</span> {event.markoNote}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        <button type="button" className="btn-small" onClick={onEdit}>
          Edit
        </button>
        {!editMode && event.status !== 'planned' && (
          <button type="button" className="btn-small" onClick={onMarkPlanned}>
            Mark planned
          </button>
        )}
        {!editMode && event.status !== 'completed' && (
          <button type="button" className="btn-small btn-success" onClick={onMarkDone}>
            We did it!
          </button>
        )}
        {editMode && (
          <button type="button" className="btn-small btn-danger" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </article>
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
      className="rounded-full px-4 py-2 text-sm"
      style={
        accent
          ? {
              background: 'var(--accent)',
              color: 'white',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent)',
            }
          : {
              background: 'rgba(255,255,255,0.85)',
              color: 'var(--season-deep)',
              border: '1px solid var(--border)',
            }
      }
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
      className="rounded-full px-3 py-1.5 text-sm transition"
      style={
        active
          ? { background: 'var(--accent)', color: 'white' }
          : { background: 'var(--season-soft)', color: 'var(--season-deep)' }
      }
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: DateStatus }) {
  const styles = {
    wishlist: 'bg-amber-50 text-amber-800 ring-amber-200',
    planned: 'bg-amber-50 text-amber-800 ring-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  };

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${styles[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function EventTypeBadge({ type }: { type: EventType }) {
  return <span className={`event-type-chip event-type-${type}`}>{EVENT_TYPE_LABELS[type]}</span>;
}

function formatDate(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSeasonFromMonth(monthIndex: number): Season {
  if (monthIndex >= 2 && monthIndex <= 4) return 'spring';
  if (monthIndex >= 5 && monthIndex <= 7) return 'summer';
  if (monthIndex >= 8 && monthIndex <= 10) return 'fall';
  return 'winter';
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function mapLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

async function fileToOptimizedDataUrl(file: File): Promise<string> {
  const rawDataUrl = await readFileAsDataUrl(file);
  if (!file.type.startsWith('image/')) return rawDataUrl;
  if (file.size <= 500_000) return rawDataUrl;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = objectUrl;
    });

    const maxWidth = 1400;
    const scale = image.naturalWidth > maxWidth ? maxWidth / image.naturalWidth : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;

    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/webp', 0.82);
  } catch {
    return rawDataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
