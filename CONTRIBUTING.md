# Contributing to ForgeGrid

Thank you for your interest in contributing to ForgeGrid! 🔧

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/internal-machine-monitor.git`
3. Install dependencies: `cd production-simulator && npm install`
4. Start development server: `npm run dev`

## Development Workflow

### Branch Naming
- `feat/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Messages
We follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add new machine type support
fix: resolve queue overflow issue
docs: update README with new API
chore: update dependencies
perf: optimize rendering performance
```

### Pull Request Process
1. Create a feature branch from `master`
2. Make your changes with clear, atomic commits
3. Ensure `npm run build` passes without errors
4. Update documentation if needed
5. Open a PR with a clear description

## Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **React**: Functional components with hooks
- **State**: Use Zustand selectors to minimize re-renders
- **Styling**: Tailwind CSS utility classes

## Project Structure

```
production-simulator/
├── src/
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── store.ts       # Zustand state management
│   ├── types.ts       # TypeScript interfaces
│   └── config.ts      # Configuration constants
```

## Need Help?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in discussions

---

Built with ⚡ by FORGE LAB
