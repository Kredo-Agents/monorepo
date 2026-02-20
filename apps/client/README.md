# Kredo - Frontend Client

This is the Next.js frontend for Kredo, providing a modern web interface for managing AI agent instances, skills, and plugins.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **tRPC** - End-to-end typesafe APIs
- **React Query** - Data fetching and caching
- **Clerk** - Authentication and user management

## Development

### Prerequisites

- Node.js 20+
- Bun (package manager)
- Clerk account (for authentication)

### Setup

1. Install dependencies (from the root of the monorepo):
   ```bash
   bun install
   ```

2. Create a `.env.local` file with your Clerk credentials:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Configure Clerk sign-in/sign-up URLs
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
   ```

3. Get your Clerk keys:
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy your Publishable Key and Secret Key from the dashboard

4. Start the dev server:
   ```bash
   bun run dev:client
   ```

The app will be available at `http://localhost:3000`.

## Authentication

The app uses Clerk for authentication, providing:

- **Sign In/Sign Up** - Pre-built authentication UI
- **User Management** - Profile management and settings
- **Session Handling** - Automatic token refresh and validation
- **Protected Routes** - Middleware-based route protection

### Authentication Flow

1. Users sign in via `/sign-in` or `/sign-up`
2. Clerk issues a session token
3. The token is automatically included in tRPC requests
4. The backend validates the token and creates/updates the user in the database

## Project Structure

```
apps/client/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── dashboard/    # Dashboard pages (protected)
│   │   ├── sign-in/      # Clerk sign-in page
│   │   ├── sign-up/      # Clerk sign-up page
│   │   ├── layout.tsx    # Root layout with ClerkProvider
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   └── providers/    # Context providers
│   │       └── TrpcProvider.tsx  # tRPC with Clerk auth
│   └── lib/              # Utilities and configurations
│       └── trpc.ts       # tRPC client setup
├── middleware.ts         # Clerk middleware for route protection
├── public/               # Static assets
└── package.json
```

## Features

- **Landing Page** - Marketing page with project information
- **Dashboard** - Overview of instances, skills, and plugins
- **Instance Management** - Create, start, stop, and monitor agent instances
- **Skills Marketplace** - Browse and install skills from ClawHub
- **Plugin System** - Manage and configure plugins
- **Real-time Updates** - Live status updates for instances
- **User Authentication** - Secure sign-in/sign-up with Clerk

## Building for Production

```bash
bun run build
```

The optimized production build will be created in the `.next` directory.

## Environment Variables

### Required

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (client-side)
- `CLERK_SECRET_KEY` - Clerk secret key (server-side)

### Optional

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:4000`)
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` - Sign-in page URL (default: `/sign-in`)
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` - Sign-up page URL (default: `/sign-up`)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
