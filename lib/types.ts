export type Season = 'spring' | 'summer' | 'fall' | 'winter' | 'anytime';

export type DateStatus = 'wishlist' | 'planned' | 'completed';

export interface DateIdea {
  id: string;
  title: string;
  description: string;
  season: Season;
  status: DateStatus;
  notes?: string;
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
