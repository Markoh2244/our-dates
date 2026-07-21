import { notFound } from 'next/navigation';

/** Root URL is private — the calendar lives at /c/{secret-token} only. */
export default function Home() {
  notFound();
}
