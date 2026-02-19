# Contributing Guide

Thanks for your interest in Kredo. We welcome contributions of all kinds, including:

- Bug reports
- Feature requests
- Documentation improvements
- Code fixes
- New features

## Code of Conduct

By participating, you agree to follow these principles:

- **Respect** - Be kind and respectful to others
- **Constructive communication** - Provide useful feedback and suggestions
- **Inclusivity** - Welcome contributors from all backgrounds
- **Professionalism** - Keep discussions professional

## How to Contribute

### Report a bug

1. Search [GitHub Issues](https://github.com/Kredo-Agents/monorepo/issues) to see if it already exists
2. If not, create a new issue
3. Use the bug report template and include:
   - Problem description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node.js version, etc.)
   - Logs or screenshots

### Suggest a feature

1. Search [GitHub Issues](https://github.com/Kredo-Agents/monorepo/issues) first
2. If not found, create a new issue
3. Use the feature request template and include:
   - Feature summary
   - Use cases
   - Expected behavior
   - Alternative approaches

### Contribute code

#### Development setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/Kredo-Agents/monorepo.git
   cd kredo
   ```
3. Add the upstream repo:
   ```bash
   git remote add upstream https://github.com/Kredo-Agents/monorepo.git
   ```
4. Install dependencies:
   ```bash
   bun install
   ```
5. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```

#### Coding standards

- **TypeScript** - Use TypeScript for all code
- **ESLint** - Follow project ESLint rules
- **Prettier** - Format code with Prettier
- **Naming** - Use meaningful names for variables and functions
- **Comments** - Add comments for complex logic

#### Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no functional change)
- `refactor` - Refactoring
- `test` - Tests
- `chore` - Build/tools

Example:

```
feat: add plugin registry filtering
```

#### Open a pull request

1. Ensure tests pass:
   ```bash
   bun run test
   ```
2. Ensure typecheck passes:
   ```bash
   bun run check
   ```
3. Push to your fork:
   ```bash
   git push origin feat/your-feature
   ```
4. Create a pull request on GitHub
5. Fill in the PR template and describe your changes
6. Wait for review

### Improve documentation

Docs live in `docs/` and use Markdown. Contributions include:

- Fix typos or grammar
- Improve explanations and examples
- Add missing documentation
- Translate docs

## Development Guide

### Project structure

```
├── apps/
│   ├── client/             # Frontend code
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   └── pages/          # Page components
│   └── server/             # Backend code
│       ├── routers.ts      # tRPC routes
│       ├── storage.ts      # Data storage
├── packages/
│   └── shared/             # Shared code
├── docs/                   # Documentation
```

### Tech stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Node.js + Express + tRPC 11
- **Database**: MySQL/TiDB + Drizzle ORM
- **Build tool**: Vite

### Run tests

```bash
# Run all tests
bun run test

# Run a specific test
bun run test -- your.test.ts

# Coverage
bun run test -- --coverage
```

### Debugging

1. Use VS Code debugging tools
2. Add `console.log` or `debugger` in code
3. Use browser devtools

## Release Process

Maintainers handle releases:

1. Update version
2. Update CHANGELOG
3. Create Git tags
4. Publish to npm (if applicable)

## Getting Help

If you run into issues while contributing:

- Read [docs](./docs/)
- Ask in [Discord](https://discord.gg/openclaw)
- Open a [GitHub Issue](https://github.com/Kredo-Agents/monorepo/issues)

## Thanks

Thanks to all contributors. Your work makes Kredo better.
