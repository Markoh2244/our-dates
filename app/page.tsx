import { DateBoard } from '@/components/DateBoard';

export default function Home() {
  return (
    <div className="romantic-bg min-h-screen">
      <div className="floating-hearts" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="heart" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
      <DateBoard />
    </div>
  );
}
