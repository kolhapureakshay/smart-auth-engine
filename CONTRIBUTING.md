# Contributing to Smart Auth Engine

Thank you for your interest in contributing to Smart Auth Engine! We welcome contributions from the community.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (Node.js version, OS, etc.)
- **Code samples** if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide detailed description** of the proposed functionality
- **Explain why this enhancement would be useful**
- **List any alternatives** you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our coding standards
4. **Add tests** for any new functionality
5. **Ensure tests pass**: `npm test`
6. **Run linting**: `npm run lint`
7. **Update documentation** if needed
8. **Commit with clear messages** (see commit guidelines below)
9. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/smart-auth-engine.git
cd smart-auth-engine

# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the project
npm run build

# Run the demo
npm run demo
```

## Project Structure

```
smart-auth-engine/
├── src/
│   ├── core/           # Core kernel and plan manager
│   ├── modules/        # Feature modules (Session, Token, RBAC, etc.)
│   ├── storage/        # Storage adapters
│   ├── types/          # TypeScript type definitions
│   └── index.ts        # Public API exports
├── tests/              # Test files
├── examples/           # Example implementations
└── scripts/            # Build and utility scripts
```

## Coding Standards

### TypeScript

- Use **TypeScript strict mode**
- Prefer **interfaces over types** for object shapes
- Use **explicit return types** for public APIs
- Avoid `any` - use `unknown` when type is truly unknown

### Code Style

- **2 spaces** for indentation
- **Semicolons** required
- **Single quotes** for strings
- Run `npm run format` before committing

### Naming Conventions

- **Classes**: PascalCase (`SessionModule`)
- **Interfaces**: PascalCase with `I` prefix optional (`IStorageAdapter` or `StorageAdapter`)
- **Functions/Methods**: camelCase (`createAuth`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Files**: kebab-case (`session-module.ts`)

## Testing Guidelines

- Write tests for **all new features**
- Maintain **high test coverage** (aim for >80%)
- Use **descriptive test names**: `it("should rotate refresh token on successful refresh")`
- Test **edge cases and error conditions**
- Mock external dependencies (Redis, etc.)

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- session-module.test.ts
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(rbac): add support for custom role hierarchies

Implement role inheritance allowing roles to extend other roles.
This enables more flexible permission management.

Closes #123
```

```
fix(token): prevent token reuse after rotation

Add family ID tracking to detect and invalidate reused tokens.

Fixes #456
```

## Module Development

To create a custom module:

```typescript
import { IAuthModule, ModuleContext } from "smart-auth-engine";

export class MyModule implements IAuthModule {
  name = "my-module";
  recommendedProfile = "starter"; // Optional plan gating

  async initialize(ctx: ModuleContext): Promise<void> {
    // Subscribe to events
    ctx.eventBus.on("auth.login", (event) => {
      // Handle login event
    });
  }

  async shutdown(): Promise<void> {
    // Cleanup resources
  }
}
```

## Documentation

- Update **README.md** for user-facing changes
- Add **JSDoc comments** for public APIs
- Update **CHANGELOG.md** following Keep a Changelog format
- Include **code examples** for new features
- Profiles are informational and help guide production deployments.
- All modules remain fully functional in OSS builds.

## Release Process

Releases are automated via GitHub Actions:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a PR to `main`
4. After merge, tag the release: `git tag v0.2.0`
5. Push tag: `git push origin v0.2.0`
6. GitHub Actions will publish to npm

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
