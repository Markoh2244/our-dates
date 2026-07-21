import { CrossIcon } from '@/components/ChristianIcons';

export default function NotFound() {
  return (
    <div className="romantic-bg flex min-h-screen items-center justify-center px-4">
      <div className="panel max-w-md p-8 text-center">
        <CrossIcon className="mx-auto mb-4 text-gold" size={32} />
        <h1 className="font-serif text-2xl text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-muted">This calendar is private.</p>
      </div>
    </div>
  );
}
