# Development Guidelines — Sri Ganesh Cloth Centre

This repository contains the web application for **Sri Ganesh Cloth Centre**, Visakhapatnam, Andhra Pradesh.

## Technology Stack

- **Framework**: TanStack Start + React 19 + TypeScript
- **Bundler**: Vite + Nitro (Cloudflare module preset)
- **Styling**: Tailwind CSS
- **Backend & Auth**: Supabase (PostgreSQL, Auth, Storage, Realtime, Database Functions)
- **State Management**: TanStack Query (React Query)
- **Testing**: Vitest + Testing Library

## Development Workflow

- Run development server: `npm run dev`
- Run type checks: `npx tsc --noEmit`
- Run linter: `npm run lint`
- Run test suite: `npm run test`
- Build production bundle: `npm run build`
- Preview production build: `npm run preview`

## Engineering Standards

- **Database Authority**: The Supabase database and database functions (RPC) are authoritative for pricing, inventory, stock deduction, and order statuses. Client-side carts and UI states must never be treated as authoritative for checkout calculations.
- **Security & RLS**: All tables have Row Level Security enabled. Never ship service-role keys to browser bundles.
- **Atomic Operations**: All checkout and payment verification workflows utilize database transactions/RPCs to ensure idempotency and atomic stock updates.
- **Code Quality**: Keep code type-safe without arbitrary `any` casts. Adhere to ESLint and Prettier rules.
