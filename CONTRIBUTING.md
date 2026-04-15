# Contributing to Weaviate Admin UI

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior by opening an issue.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/weaviate-admin-ui.git
   cd weaviate-admin-ui
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/<org>/weaviate-admin-ui.git
   ```

## Development Setup

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Weaviate | 1.23+ (local or remote) |

### Quick Start (both services)

```bash
./start-dev.sh
```

This creates `.env` files, installs dependencies, and starts both services:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API docs**: http://localhost:8000/docs

### Manual Setup

#### Backend (FastAPI)

```bash
cd weaviate-admin-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Copy and edit the env file
cp .env.example .env

# Start the dev server
uvicorn app.main:app --reload --port 8000
```

#### Frontend (React + TypeScript)

```bash
cd weaviate-admin-ui
npm install

# Copy and edit the env file
cp .env.example .env

# Start the dev server
npm start
```

## Project Structure

```
├── weaviate-admin-api/        # FastAPI backend
│   ├── app/
│   │   ├── api/v1/            # Route handlers
│   │   ├── middleware/        # Auth middleware
│   │   ├── models/            # Pydantic models
│   │   ├── services/          # Business logic
│   │   └── utils/             # Helpers & validators
│   └── tests/                 # Backend tests
├── weaviate-admin-ui/         # React frontend
│   ├── src/
│   │   ├── api/               # API client layer
│   │   ├── components/        # Reusable UI components
│   │   ├── contexts/          # React contexts
│   │   ├── pages/             # Page-level components
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Frontend utilities
│   └── public/
├── docker-compose.yml         # Docker orchestration
├── start-dev.sh               # Dev startup script
└── stop-dev.sh                # Dev shutdown script
```

## Making Changes

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** — keep commits small and focused.
3. **Write or update tests** for any new or changed functionality.
4. **Run the test suites** (see [Testing](#testing)).
5. **Commit** using clear, descriptive messages:
   ```
   feat: add filter support to data browser
   fix: correct pagination offset in query builder
   docs: update deployment guide for Docker Compose v2
   ```
   We loosely follow [Conventional Commits](https://www.conventionalcommits.org/).

## Testing

### Backend Tests

```bash
cd weaviate-admin-api
source venv/bin/activate
PYTHONPATH=. pytest -q
```

### Frontend Tests

```bash
cd weaviate-admin-ui
CI=true npm test -- --watchAll=false --passWithNoTests
```

### Frontend Production Build

```bash
cd weaviate-admin-ui
npm run build
```

Make sure all tests pass and the build succeeds before submitting a PR.

## Pull Request Process

1. **Push** your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. **Open a Pull Request** against `main` on the upstream repository.
3. Fill out the PR template with:
   - A clear description of what changed and why
   - Screenshots for UI changes
   - Related issue numbers (e.g., `Closes #42`)
4. A maintainer will review your PR. Please respond to feedback promptly.
5. Once approved, a maintainer will merge your PR.

### PR Checklist

- [ ] Tests pass locally (`pytest` and `npm test`)
- [ ] No new lint warnings
- [ ] Documentation updated if applicable
- [ ] Commit messages follow conventional commit format
- [ ] PR description clearly explains the change

## Style Guidelines

### Python (Backend)

- Follow [PEP 8](https://peps.python.org/pep-0008/).
- Use type hints for function signatures.
- Use Pydantic models for request/response schemas.
- Keep route handlers thin; put logic in `services/`.

### TypeScript / React (Frontend)

- Use functional components with hooks.
- Use TypeScript strict mode — avoid `any` where possible.
- Keep components small and composable.
- Co-locate component-specific types in the component file or in `types/`.

### General

- Write meaningful variable and function names.
- Add docstrings / JSDoc comments for public functions.
- Keep files focused — one responsibility per module.

## Reporting Issues

- Use [GitHub Issues](../../issues) to report bugs or request features.
- Include steps to reproduce for bug reports.
- Provide browser/OS/Python/Node versions where relevant.
- Search existing issues before creating a new one.

## License

By contributing to this project, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
