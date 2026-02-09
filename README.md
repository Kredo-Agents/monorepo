# Kredo

**Give OpenClaw a cloud-native home.** One deployment, unlimited conversations across Web, Element, Slack, and more. Hot-swappable skills, native Opencode integration, one-click infrastructure, and live config updates so you can focus on creation.

---

![Kredo Dashboard](docs/images/dashboard.webp)

## Why Kredo?

Kredo is more than a dashboard. It is a unified control center for AI agent ecosystems. We remove the friction of deployment, configuration, and integrations so you can focus on your agents.

- **Cloud-native, one-click deploy**: Spin up complete, isolated agent instances with Docker.
- **Multi-channel chat**: Talk to agents on Element, Telegram, Discord, and more with a consistent experience.
- **Hot-swappable skills**: Install from the 700+ ClawHub skills marketplace or create your own, no restarts required.
- **Unified management**: Monitor instance status, manage skills and plugins, and review chat history in one place.
- **Security and privacy**: Each agent runs in an isolated environment to protect data.
- **Open source, community-driven**: Fully open source and built with the global developer community.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + Next.js 16
- **Backend**: Node.js + Express + tRPC 11
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Clerk

## Quick Start

### Prerequisites

- Node.js 22+
- Bun
- Docker & Docker Compose
- MySQL 8+ or TiDB

### Local setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/Kredo-Agents/monorepo.git
   cd kredo
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment variables**
   Copy `.env.example` to `.env`, then adjust settings for your environment.
   ```bash
   cp .env.example .env
   ```
   
   **Important**: Set up Clerk authentication:
   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy your keys and update these in `.env`:
     ```
     CLERK_SECRET_KEY=sk_test_your_secret_key
     VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
     ```
   
   Also create `apps/client/.env.local` for the frontend:
   ```bash
   cat > apps/client/.env.local << EOF
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
   CLERK_SECRET_KEY=sk_test_your_secret_key
   
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard
   EOF
   ```

4. **Initialize the database**
   ```bash
   bun run db:push
   ```

5. **Start the dev server**
   ```bash
   bun run dev
   ```

The app should be running at `http://localhost:3000`.

## Documentation

- **[User Manual](./docs/user-manual.md)**: Learn the core platform features.
- **[Deployment Guide](./docs/deployment.md)**: Deploy Kredo to production.
- **[Plugin Development](./docs/plugin-development.md)**: Build custom plugins.
- **[Skill Writing Guide](./docs/skill-writing-guide.md)**: Write skills for OpenClaw agents.
- **[API Reference](./docs/api.md)**: tRPC API documentation.

## Contributing

We welcome contributions from the community, whether feature ideas, code changes, or documentation improvements.

Please read the **[Contributing Guide](./CONTRIBUTING.md)** before you start.

## License

Kredo is released under the [MIT License](./LICENSE).

## Contact and Collaboration

**We welcome collaboration.**

WeChat: `huhurun2022` | [GitHub Issues](https://github.com/Kredo-Agents/monorepo/issues) | [Discussions](https://github.com/Kredo-Agents/monorepo/discussions)

---
