# Contributing to CLIM

Thank you for your interest in contributing to CLIM! This document outlines the process for setting up the project locally and submitting your contributions.

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** (bundled with Node.js)
- **Git** (for version control)

### Local Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork locally
git clone https://github.com/<your-username>/CLIM.git
cd CLIM

# 3. Install dependencies
npm install

# 4. Install native dependencies
npm run postinstall

# 5. Start the development server
npm run dev
```

---

## Development Workflow

### Project Structure

```
CLIM/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # App entry point
│   │   ├── ipc-handlers.ts   # IPC handlers
│   │   ├── port-manager.ts   # Port management logic
│   │   └── pty-manager.ts    # Terminal management logic
│   ├── renderer/          # React renderer
│   │   ├── components/    # UI components
│   │   ├── stores/        # Zustand state management
│   │   ├── hooks/         # Custom React hooks
│   │   └── App.tsx        # App root
│   ├── shared/            # Shared types
│   └── preload/           # Electron preload scripts
├── docs/                  # Documentation
├── tests/                 # Test files (if applicable)
├── vitest.config.ts       # Vitest configuration
└── setupTests.ts          # Test setup file
```

### Code Style & Conventions

- **TypeScript** is required for all source files.
- **Prettier** is used for formatting. Run `npx prettier --write .` before committing.
- **ESLint** is used for linting. Run `npx eslint . --fix` before committing.
- Follow existing patterns for component structure and naming conventions.
- Use `@/` as the alias for paths under `src/renderer/`.
- Use `@shared/` as the alias for paths under `src/shared/`.

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run all tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

Test files should be placed alongside their corresponding source files in a `.test.ts` or `.test.tsx` file.

### Type Checking

```bash
# Full typecheck (both node and web)
npm run typecheck
```

---

## Submitting Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Include unit tests for any new logic.
   - Ensure all existing tests pass.
   - Ensure `npm run typecheck` passes without errors.

3. **Commit your changes**:
   - Use clear, descriptive commit messages.
   - Reference any related issues.

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request**:
   - Provide a clear description of the changes.
   - Include relevant screenshots or videos if applicable.
   - Link any related issues.

---

## Coding Standards

- Use functional components with TypeScript interfaces for props.
- Prefer early returns and guard clauses for readability.
- Keep functions small and focused — if a function exceeds 50 lines, consider refactoring.
- Add JSDoc comments for public APIs and complex logic.
- Avoid deeply nested conditionals — use early returns.
- Use meaningful variable names — avoid abbreviations unless widely understood.

### Security Best Practices

- Always validate and sanitize input from renderer processes in IPC handlers.
- Never expose Node.js APIs directly to the renderer without context isolation.
- Use `contextBridge` to expose only necessary functions via `contextBridge.exposeInMainWorld`.
- Avoid dynamic `eval()` or `new Function()` in any context.

---

## Reporting Issues

When reporting an issue, please include:

- **Environment**: OS, Node.js version, CLIM version
- **Steps to reproduce**: Clear steps to reproduce the bug
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Screenshots**: If applicable

---

## License

By contributing to CLIM, you agree that your contributions will be licensed under the MIT License.
