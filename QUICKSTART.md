# Kredo - Quick Start Guide

This guide helps you deploy Kredo locally in about 5 minutes.

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- Or Node.js 22+ and Bun

## Option 1: Docker Compose (recommended)

### 1. Extract the project

If you downloaded a release archive, extract it and enter the directory.

### 2. Configure environment variables

```bash
# Copy the env template
cp .env.example .env

# Database config
MYSQL_PASSWORD=change_me
DATABASE_URL=mysql://root:change_me@db:3306/kredo

# App config
PORT=3000

# Security config (change for production)
JWT_SECRET=change_me
```

### 3. Start services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Initialize the database

```bash
# Wait for DB startup (~10s)

# Enter app container
docker-compose exec app sh

# Run migrations
bun run db:push

# Exit container
exit
```

### 5. Access the app

Open `http://localhost:3000`.

### Stop services

```bash
docker-compose down
```

## Option 2: Local Development

### 1. Extract the project

If you downloaded a release archive, extract it and enter the directory.

### 2. Install dependencies

```bash
# Install project dependencies
bun install
```

### 3. Start MySQL

**Option A: Docker**

```bash
docker run --name kredo-mysql -e MYSQL_ROOT_PASSWORD=change_me -e MYSQL_DATABASE=kredo -p 3306:3306 -d mysql:8
```

**Option B: Local MySQL**

Create a database:

```sql
CREATE DATABASE kredo;
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

### 5. Initialize the database

```bash
bun run db:push
```

### 6. Start the dev server

```bash
bun run dev
```

The app runs at `http://localhost:3000`.

## Next Steps

1. **Read the docs**
   - [User Guide](./docs/user-guide.md) - Learn how to use the platform
   - [Deployment Guide](./docs/deployment.md) - Production deployment
   - [Plugin Development](./docs/plugin-development.md) - Build custom plugins
2. **Create your first instance**
   - After login, click **Create Instance** on the dashboard
   - Enter name and description
   - Click **Create**
3. **Browse the Skills marketplace**
   - Click **Skills** in the sidebar
   - Browse 700+ community skills
   - Install the skills you need

## FAQ

### Port in use

If ports 3306 or 3000 are occupied, update `.env`:

```bash
PORT=3001
```

Then update port mappings in `docker-compose.yml`.

### Database connection failed

1. Check MySQL: `docker-compose ps`
2. Verify `DATABASE_URL`
3. Wait for DB to be fully ready (10-15 seconds)

### App fails to start

1. Check logs: `docker-compose logs app`
2. Verify environment variables
3. Ensure migrations completed

## Getting Help

- Docs: [docs/](./docs/)

Enjoy using Kredo!
