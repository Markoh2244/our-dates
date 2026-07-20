# Our Date Adventures

A romantic, editable date planner — filled with season-specific ideas and room for your own.

**Live site:** _(deploying...)_

## Features

- Seasonal date ideas pre-loaded (spring blooms, summer adventures, fall corn mazes, winter Christmas lights, and more)
- Mark dates as **Wishlist**, **Planned**, or **Completed**
- **Edit mode** to add, update, or remove dates
- Filter by season or status
- Auto-saves in your browser
- **Export / Import** JSON to share the list between devices

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to edit dates

1. Click **Edit dates** on the homepage
2. Add new ideas, edit existing ones, or delete entries
3. Use **Export** to back up your list, or **Import** to load it on another device

## Deploy

```bash
npm run build
npx vercel --prod
```

## Tech

Next.js · TypeScript · Tailwind CSS · localStorage
