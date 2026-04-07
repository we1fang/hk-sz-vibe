# HK-SZ Vibe

A tri-lingual web app for checking Hong Kong-Shenzhen land border queue conditions with a fast, commuter-friendly UI.

## Live Demo

- Production: [https://hk-sz-commute.vercel.app](https://hk-sz-commute.vercel.app)

## Repository

- GitHub: [https://github.com/we1fang/hk-sz-vibe](https://github.com/we1fang/hk-sz-vibe)

## Overview

HK-SZ Vibe is a lightweight frontend project built for cross-border commuters who want a clearer view of land crossing queue conditions. It presents queue data in a more visual and accessible way, supports Simplified Chinese, Traditional Chinese, and English, and is designed to work smoothly on both desktop and mobile.

The app fetches immigration queue data through a same-origin proxy path, which keeps the browser request flow clean and avoids direct cross-origin API issues in production.

## Features

- Tri-lingual interface: Simplified Chinese, Traditional Chinese, and English
- Direction switch for traveling to Hong Kong or returning to Shenzhen
- Live queue status display for supported land ports
- "Fastest crossing" recommendation based on current queue conditions
- Official and fallback display logic for unstable upstream responses
- Mobile-friendly responsive UI
- Footer attribution with linked data source

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Vercel

## What This Project Demonstrates

- Frontend product thinking for a real commuter use case
- Multilingual content architecture with locale switching
- API integration and same-origin proxy design
- Production deployment with Vercel rewrites
- UI design focused on clarity, speed, and information hierarchy

## Data Source

Queue-related data is sourced from the Hong Kong Immigration Department via [data.gov.hk](https://www.data.gov.hk/).

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Deployment Notes

This project is configured for Vercel deployment.

- Local development proxy is configured in `vite.config.ts`
- Production rewrite is configured in `vercel.json`
- Client requests use the relative `/immd-data/...` path

## Suggested Portfolio Copy

You can reuse this short description in your portfolio site or resume:

> Built a tri-lingual web app for Hong Kong-Shenzhen commuters to check land border queue conditions, with multilingual UI support, proxy-based API integration, and production deployment on Vercel.

## Screenshots

Add 2 to 4 screenshots here for stronger portfolio presentation. Suggested shots:

- Home screen with the fastest crossing recommendation
- Port cards showing queue conditions
- Language switching in action
- Footer data source attribution

## Author

Created by We1fang.
