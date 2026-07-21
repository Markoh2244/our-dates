export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'anytime';

export type DateStatus = 'wishlist' | 'planned' | 'completed';
export type EventType =
  | 'service'
  | 'walk'
  | 'adventure'
  | 'family'
  | 'food'
  | 'travel'
  | 'learning'
  | 'milestone'
  | 'faith'
  | 'cozy';

export interface DateIdea {
  id: string;
  title: string;
  description: string;
  season: Season;
  status: DateStatus;
  eventType: EventType;
  address?: string;
  livNote?: string;
  markoNote?: string;
  imageDataUrl?: string;
  imageName?: string;
  plannedFor?: string;
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
  winter: 'Winter',
  anytime: 'Anytime',
};

export const SEASON_EMOJI: Record<Season, string> = {
  spring: '🌸',
  summer: '☀️',
  fall: '🍂',
  winter: '❄️',
  anytime: '💫',
};

export const STATUS_LABELS: Record<DateStatus, string> = {
  wishlist: 'Wishlist',
  planned: 'Planned',
  completed: 'Completed',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  service: 'Service',
  walk: 'Walk',
  adventure: 'Adventure',
  family: 'Family Time',
  food: 'Food / Cafe',
  travel: 'Travel',
  learning: 'Learning',
  milestone: 'Milestone',
  faith: 'Faith',
  cozy: 'Cozy Time',
};
