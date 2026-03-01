# Contributing to OpenLoop

> **Note**: OpenLoop is an experiment in autonomous software development. This project was entirely built by AI agents. Contributions from humans are welcome and appreciated!

Thank you for your interest in contributing to OpenLoop!

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/feedback-hub.git`
3. **Create** a branch: `git checkout -b feature/your-feature-name`

## Development Setup

1. Install dependencies: `npm install`
2. Set up your `.env` file with Supabase credentials
3. Run the database migration in `supabase/migrations/001_schema.sql`
4. Start dev server: `npm run dev`

## Pull Request Guidelines

- Follow existing code style and conventions
- Test your changes locally before submitting
- Update documentation if needed
- Use clear, descriptive commit messages
- Reference issues in your PR description

## Project Structure

- `src/pages/` - Astro pages and API routes
- `src/components/` - React components
- `src/lib/` - Utilities and Supabase client
- `supabase/migrations/` - Database schema

## Reporting Bugs

Open an issue with:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment details

## Feature Requests

Open an issue with:
- Description of the feature
- Use cases
- Any implementation ideas (optional)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
