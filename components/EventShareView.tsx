import Link from 'next/link';
import type { CSSProperties } from 'react';
import { CrossIcon } from '@/components/ChristianIcons';
import { CopyEventLinkButton } from '@/components/CopyEventLinkButton';
import { formatEventSchedule } from '@/lib/time-format';
import { eventSharePath } from '@/lib/event-slug';
import {
  DateIdea,
  EVENT_TYPE_LABELS,
  SEASON_EMOJI,
  SEASON_LABELS,
  STATUS_LABELS,
} from '@/lib/types';

function mapLink(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function EventShareView({
  event,
  calendarHref,
}: {
  event: DateIdea;
  calendarHref?: string;
}) {
  const scheduleLabel = formatEventSchedule(event);
  const seasonTheme = event.season === 'anytime' ? 'summer' : event.season;
  const sharePath = eventSharePath(event);

  return (
    <div className={`romantic-bg season-theme-${seasonTheme}`}>
      <div className="floating-crosses" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="floating-cross" style={{ '--i': i } as CSSProperties}>
            ✝
          </span>
        ))}
      </div>
      <div className={`season-scene season-scene-${seasonTheme}`} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="season-particle" style={{ '--i': i } as CSSProperties} />
        ))}
      </div>

      <div className="relative z-1 mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm">
          {calendarHref ? (
            <Link href={calendarHref} className="event-back-link">
              ← Back to our calendar
            </Link>
          ) : (
            <span className="font-serif italic text-muted">Liv + Marko</span>
          )}
          <CopyEventLinkButton path={sharePath} />
        </nav>

        <article className={`event-share panel p-6 sm:p-8 event-type-${event.eventType}`}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="season-badge">
              {SEASON_EMOJI[event.season]} {SEASON_LABELS[event.season]}
            </span>
            <span className={`event-type-chip event-type-${event.eventType}`}>
              {EVENT_TYPE_LABELS[event.eventType]}
            </span>
            <span className="season-badge">{STATUS_LABELS[event.status]}</span>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Liv + Marko
          </p>
          <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">{event.title}</h1>

          {scheduleLabel && (
            <p className="mt-3 font-serif text-lg italic text-gold">{scheduleLabel}</p>
          )}

          {event.imageDataUrl && (
            <div className="event-share__photo mt-6">
              <img src={event.imageDataUrl} alt={event.title} />
            </div>
          )}

          {event.description && (
            <section className="mt-8">
              <h2 className="memory-block__label">Our memory</h2>
              <p className="mt-2 font-serif text-lg leading-relaxed text-ink whitespace-pre-wrap">
                {event.description}
              </p>
            </section>
          )}

          {event.schedule && (
            <section className="schedule-block mt-8">
              <h2 className="schedule-block__label">Schedule</h2>
              <p className="mt-2 text-base leading-relaxed text-ink whitespace-pre-wrap">
                {event.schedule}
              </p>
            </section>
          )}

          {event.address && (
            <p className="mt-6 text-sm text-ink">
              <span className="font-semibold">Where:</span>{' '}
              <a
                href={mapLink(event.address)}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {event.address}
              </a>
            </p>
          )}

          {(event.livNote || event.markoNote) && (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {event.livNote && (
                <p
                  className="rounded-xl px-4 py-3 text-sm text-ink"
                  style={{ background: 'var(--accent-soft)' }}
                >
                  <span className="font-semibold">Liv:</span> {event.livNote}
                </p>
              )}
              {event.markoNote && (
                <p
                  className="rounded-xl px-4 py-3 text-sm text-ink"
                  style={{ background: 'var(--accent-soft)' }}
                >
                  <span className="font-semibold">Marko:</span> {event.markoNote}
                </p>
              )}
            </div>
          )}
        </article>

        <footer className="mt-10 text-center text-sm text-muted">
          <div className="mb-2 flex items-center justify-center gap-2 text-gold">
            <CrossIcon size={16} />
            <span className="font-serif italic">Christ at the center of our love</span>
            <CrossIcon size={16} />
          </div>
          <p>A shared moment from Liv &amp; Marko&apos;s memory calendar.</p>
        </footer>
      </div>
    </div>
  );
}
