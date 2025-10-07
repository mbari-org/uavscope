# Contributing

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to automatically generate changelogs and determine semantic versioning.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature (triggers minor version bump)
- `fix`: A bug fix (triggers patch version bump)
- `perf`: Performance improvements (triggers patch version bump)
- `refactor`: Code refactoring (triggers patch version bump)
- `docs`: Documentation changes (no version bump)
- `style`: Code style changes (no version bump)
- `test`: Adding or updating tests (no version bump)
- `build`: Build system changes (no version bump)
- `ci`: CI/CD changes (no version bump)
- `chore`: Other changes (no version bump)

### Examples

```bash
feat: add new map layer for flight paths
fix: resolve timeline animation performance issue
docs: update README with new installation steps
perf: optimize map rendering for large datasets
refactor: simplify detection filtering logic
```

### Validating Commits

You can validate your commit messages using:

```bash
npm run commitlint
```

## Semantic Release

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) to automatically:

- Determine the next version number
- Generate changelogs
- Create GitHub releases
- Publish packages

### Release Branches

- `main`: Production releases

### Release Process

1. Push commits to `main` branch
2. GitHub Actions will automatically run semantic-release
3. If there are releasable changes, a new version will be created
4. Changelog will be updated automatically
5. GitHub release will be created with distribution files

### Manual Release

You can run semantic-release manually:

```bash
npm run semantic-release
```

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Write conventional commit messages
4. Create a pull request to `main`
5. Once merged, semantic-release will handle versioning and releases
