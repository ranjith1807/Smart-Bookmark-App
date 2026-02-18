This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🧠 Challenges & Solutions

### 1. React Hoisting & Initialization Errors
**The Problem:** When converting the logic to the `useEffect` hook, I initially encountered a `ReferenceError: Cannot access 'fetchBookmarks' before initialization`. This happened because I was calling the fetch function inside the effect before it was defined in the component scope.

**The Solution:** I refactored the code to wrap the data fetching logic in a `useCallback` hook. This not only solved the hoisting issue but also stabilized the function reference, preventing unnecessary re-renders when passed as a dependency to `useEffect`.

### 2. Real-time Subscription Duplication
**The Problem:** While testing the Supabase Realtime feature, I noticed that sometimes the app would attempt to create multiple subscriptions, leading to performance warnings or erratic UI updates.

**The Solution:** I implemented a strict cleanup function within the `useEffect` hook. By calling `supabase.removeChannel(channel)` in the return statement, I ensured that the previous subscription is always destroyed before a new one is created (e.g., when the user logs out or the component unmounts).

### 3. TypeScript Type Safety with Supabase
**The Problem:** Moving from JavaScript to TypeScript, the Supabase client returns data as `any` by default, which defeated the purpose of using TS.

**The Solution:** I created a strict `interface Bookmark` matching my PostgreSQL table schema (id, title, url, user_id). I then cast the Supabase response (`data as Bookmark[]`) to ensure Intellisense works correctly and to catch potential property typos at compile time.