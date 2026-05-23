# Oddo Hackathon

OneFlow is a modular Project Management system that takes your projects from planning to execution to billing seamlessly. Manage projects, tasks, timesheets, and finances—all integrated in one unified platform. The application is deployed on [Vercel](https://oddo-hackathon-pied.vercel.app) and uses a JavaScript + Prisma + Next.js stack. And here is the demo video: [Click here](https://drive.google.com/file/d/1llmVyhT2Tzix841EKJA5y-EqIiAJBu7E/view?usp=drive_link)

## Table of Contents
1. Overview
2. Live Demo
3. Core Features
4. Architecture
5. Tech Stack
6. Project Structure
7. Data & Database Layer
8. Getting Started
9. Configuration & Environment
10. Scripts
11. Development Workflow
12. Testing (Suggested)
13. Deployment
14. Security Considerations
15. Performance & Optimization
16. Accessibility & UX
17. Logging & Monitoring (Suggested)
18. Contributing
19. Roadmap
20. FAQ
21. License
22. Acknowledgements

---

## 1. Overview
Oddo x Amalthea IIT Gandhinagar Hackathon, we have developed OneFlow -Plan to Bill in One Place (Problem Statement-1) web application to manage projects and teams. It emphasizes:
- Clean separation of concerns (Role based Access: Admin, Project Manager, employee)
- Extensible data modeling (via Prisma) and storage (Postgres)
- Next.JS App Routing
- Fast iteration with component-driven development (as it was 24 hour hackathon)

## 2. Live Demo
- Google Drive Link (Demo Video): https://drive.google.com/file/d/1llmVyhT2Tzix841EKJA5y-EqIiAJBu7E/view?usp=drive_link
- Production URL: https://oddo-hackathon-pied.vercel.app  

## 3. Core Features (Adjust to actual functionality)
- User onboarding & bulk import (via `sample-users.csv`)
- Role-based or contextual UI components (if implemented)
- Dynamic server-rendered + client-interactive pages
- API endpoints (REST or Next.js route handlers)
- Database persistence using Prisma ORM
- Responsive and accessible UI components

## 4. Architecture
The application follows a layered approach:

| Layer | Responsibility |
|-------|----------------|
| UI (React / Next.js) | Rendering pages, components, interactions |
| Application Logic | Validation, orchestration of workflows |
| Data Access (Prisma) | Database queries, schema, migrations |
| Scripts | Operational utilities (seeding, maintenance) |
| Static Assets (`public/`) | Images, icons, static downloads |
| Configuration | Build, lint, and environment definitions |

## 5. Tech Stack
- Framework: Next.js
- Language: JavaScript (ES Modules)
- Styling: Tailwind CSS or PostCSS pipeline (`postcss.config.mjs`)
- ORM: Prisma
- Database: PostgreSQL
- Package Manager: pnpm (`pnpm-lock.yaml`)
- Build & Linting: Next.js + ESLint (`eslint.config.mjs`)
- Deployment: Vercel
- Version Control: Git / GitHub

## 6. Project Structure

```
.
├── .gitignore
├── .vscode/                 # Editor settings (recommend adding workspace linting / formatting)
├── README.md
├── components.json          # Likely component registry (e.g. shadcn/ui or custom design system)
├── eslint.config.mjs
├── jsconfig.json            # Path aliases / IntelliSense configuration
├── next.config.mjs          # Next.js runtime/build configuration
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── prisma/                  # Prisma schema & migrations
├── public/                  # Static assets served as-is
├── sample-users.csv         # Example dataset for seeding/import
├── scripts/                 # Automation & operational scripts
└── src/                     # Application source (pages, components, lib, routes)
```

Suggested internal `src/` subdivision (adjust to actual):
```
src/
├── app/ or pages/           # Route handlers / Pages
├── components/              # Reusable UI components
├── styles/                  # Global styles (if separate)
├── lib/                     # Helpers, services, utilities
├── server/                  # Server-side logic / API wrappers
└── hooks/                   # Custom React hooks
```

## 7. Data & Database Layer

### Prisma
The `prisma/` directory typically contains:
- `schema.prisma` – Data model definitions
- `migrations/` – Auto-generated after running `prisma migrate dev`

Run:
```bash
pnpm prisma migrate dev
pnpm prisma generate
```

### Data Import
The `sample-users.csv` file suggests batch onboarding functionality. Recommended approach:
1. Parse CSV (e.g. using `papaparse` or `csv-parse`)
2. Validate rows (email format, uniqueness)
3. Upsert into database via Prisma in a transaction

Pseudo-script structure (inside `scripts/`):
```js
// scripts/import-users.mjs
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse';
```

### Suggested Schema Snippet (Adjust to real schema)
```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## 8. Getting Started

### Prerequisites
- Node.js ≥ 18.x (align with Next.js requirements)
- pnpm ≥ 8.x
- A running database (PostgreSQL recommended)

### Installation
```bash
git clone https://github.com/manavdhamecha77/Oddo-Hackathon.git
cd Oddo-Hackathon
pnpm install
```

### Database Setup
1. Create database
2. Set `DATABASE_URL` in `.env`
3. Run migrations and seed the baseline data:
   ```bash
  pnpm db:setup
   ```

If you need to re-apply schema changes during development, use `pnpm prisma migrate dev`. For a brand-new database or production-like environment, `pnpm db:setup` is the safer choice.

### Development
```bash
pnpm dev
```
Navigate to `http://localhost:3000`.

## 9. Configuration & Environment

Create a `.env` file:
```
DATABASE_URL="postgresql://user:password@host:port/dbname"
JWT_SECRET="your-long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Required for email features:
EMAIL_USER="your-gmail-address@gmail.com"
EMAIL_APP_PASSWORD="your-gmail-app-password"

# Required for OCR bill processing:
OCR_SPACE_API_KEY="..."
```

The current runtime uses `JWT_SECRET` for auth tokens, not `AUTH_SECRET` or `NEXTAUTH_SECRET`.

`DATABASE_URL` is required for all Prisma-backed API routes and seed scripts. `EMAIL_USER`, `EMAIL_APP_PASSWORD`, and `OCR_SPACE_API_KEY` are only needed when you use the email or OCR flows.

Never commit secrets. Use the Vercel dashboard for production environment variables.

## 10. Scripts

Add (or confirm) helpful entries in `package.json`:
```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed",
    "db:setup": "prisma migrate deploy && prisma db seed"
  }
}
```

## 11. Development Workflow
1. Create feature branch: `feat/<short-description>`
2. Implement + commit with conventional commits (e.g. `feat: add bulk user import`)
3. Lint & format before pushing:
   ```bash
   pnpm lint
   ```
4. Open PR & ensure preview deploy on Vercel
5. Request review (2 reviewers if critical)

## 12. Testing (Suggested)
If not yet implemented, recommended setup:
- Unit: Vitest or Jest
- Integration: Playwright or Cypress
- Suggested scripts:
  ```bash
  pnpm test
  pnpm test:watch
  ```
Add CI pipeline (GitHub Actions) for automated test + lint + build.

## 13. Deployment

### Vercel
- Auto-deploys on push to `main`.
- Preview deployments for PRs.
- Ensure environment variables configured in Vercel dashboard.
- `next.config.mjs` can optimize images/domains/performance.

### Database Migrations
Automate migration on deploy (use a post-deployment hook or manual trigger):
```bash
pnpm prisma migrate deploy
```

For a fresh database, initialize it with:
```bash
pnpm db:setup
```

## 14. Security Considerations
- Validated all user input server-side.
- Escaped rendered dynamic content.
- Used HTTPS everywhere (Vercel default).
- To rotate secrets periodically.
- Principle of least privilege on database user.

## 15. Performance & Optimization
- Leverage Next.js Image Optimization (`next/image`)
- Code-splitting via dynamic imports
- Prisma query optimization (indexes on frequently filtered columns)
- Use caching headers for static assets in `public/`
- Consider Redis (future) for caching heavy reads

## 16. Accessibility & UX
- Semantic HTML and ARIA where needed
- Color contrast compliance (WCAG AA)
- Keyboard navigability tested
- Descriptive alt text for images

## 17. Logging & Monitoring (Suggested)
Potential additions:
- Structured logging (pino / Winston)
- Error tracking (Sentry)
- Performance metrics (Vercel Analytics / OpenTelemetry)

## 18. Contributing

### Guidelines
- Fork & branch naming: `feat/`, `fix/`, `chore/`
- Write clear commit messages
- add .env file in root (See Appendix C for env variables)
- Keep PRs focused & small
- Provide tests where applicable

### Code Style
Enforced via ESLint config (`eslint.config.mjs`). Consider adding Prettier if not already integrated.

## 19. Roadmap (Sample – adjust)
| Milestone | Description | Status |
|-----------|-------------|--------|
| Authentication | Add secure auth (NextAuth or custom) | Planned |
| Role Management | RBAC for admin vs standard users | Planned |
| Bulk Import UI | Frontend interface for CSV import | In Progress |
| Metrics Dashboard | Visualize user data trends | Backlog |
| API Hardening | Rate limiting & input schema validation | Planned |

## 20. FAQ
**Q: How do I seed sample data?**  
A: Place or edit `sample-users.csv`, then run the import script (to be implemented under `scripts/`).

**Q: What database is supported?**  
A: Any Prisma-supported provider (PostgreSQL recommended).

**Q: How are environment variables managed?**  
A: Local via `.env`, production via Vercel dashboard.

## 21. License
(Insert appropriate license. If undecided, consider MIT.)
```
MIT License © YEAR AUTHOR(S)
```

## 22. Acknowledgements
- Hackathon organizers
- Open-source libraries (Prisma, Next.js, etc.)
- Contributors & reviewers

---

## Appendix A
- To add `docs/` folder for deeper architectural specs
- Set up automated accessibility audits (axe / Lighthouse CI)
- Implement spinner/error states for asynchronous UI flows

## Appendix B: Sample CSV Format
```
email,name
jane.doe@example.com,Jane Doe
john.smith@example.com,John Smith
```

## Appendix C: env variables
```
DATABASE_URL=...
JWT_SECRET=...

NEXT_PUBLIC_APP_URL=...

EMAIL_USER=...
EMAIL_APP_PASSWORD=...

OCR_SPACE_API_KEY=...
```

Legacy names such as `AUTH_SECRET` and `NEXT_PUBLIC_BASE_URL` are no longer used by the codebase.

Have these values in your `.env` file at the project root for local setup and contributions.

Ensure validation before import.

---
