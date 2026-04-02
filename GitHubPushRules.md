# CongDongViet Frontend – Git & GitHub Push Rules

This document defines the official Git workflow and rules for pushing code to GitHub for the project:

**Repository:** `https://github.com/vitadev88/CDV-CLIENT.git`

---

# 1. Branching Strategy

We use a simplified Git Flow model.

## Main Branches

* `main` → Production-ready code only (auto-deploys to Vercel)
* `develop` → Integration branch (staging environment)

## Supporting Branches

* `feature/{feature-name}`
* `bugfix/{bug-name}`
* `hotfix/{hotfix-name}`
* `refactor/{module-name}`

---

# 2. Branch Rules

## ❌ Never Push Directly To:

* `main`
* `develop`

All changes must go through Pull Request (PR).

---

# 3. Feature Development Workflow

## Step 1 — Sync develop

```bash
git checkout develop
git pull origin develop
```

## Step 2 — Create feature branch

```bash
git checkout -b feature/listing-card
```

Branch naming:

```text
feature/listing-card
feature/auth-login
feature/search-filter
feature/user-profile
```

---

## Step 3 — Commit Rules

### Commit Message Format

We follow Conventional Commits:

```text
feat: add listing card component
fix: correct mobile header alignment
refactor: optimize category sidebar
docs: update README
chore: update dependencies
style: adjust spacing on homepage
```

### Types

* `feat:` → new feature or page
* `fix:` → bug fix
* `refactor:` → code improvement (no feature change)
* `style:` → CSS/UI changes only (no logic change)
* `docs:` → documentation
* `test:` → adding tests
* `chore:` → config or dependency updates

---

## Step 4 — Push Feature Branch

```bash
git push origin feature/listing-card
```

---

# 4. Pull Request Rules

After pushing, create a Pull Request:

Base branch: `develop`
Compare branch: `feature/{feature-name}`

PR title format:

```text
[FEATURE] Listing Card Component
[FIX] Mobile Header Logo Alignment
[REFACTOR] Category Sidebar Optimization
[STYLE] Homepage Layout Spacing
```

## ⚠️ One Branch = One PR

**Never push new commits to a branch after its PR has been merged.**

If you have more changes after a PR is merged:

```bash
# Create a new branch from develop
git checkout develop
git pull origin develop
git checkout -b fix/logo-height
git add .
git commit -m "fix: constrain logo height on mobile"
git push origin fix/logo-height
# Then create a new PR
```

❌ Wrong — push to already-merged branch:
```bash
git push origin feature/full-app-implementation  # after PR already merged
```

✅ Correct — create new branch for each PR:
```bash
git checkout -b fix/logo-height
git push origin fix/logo-height
```

---

# 5. Pull Request Checklist

Before merging, ensure:

* [ ] No TypeScript errors (`npx tsc --noEmit`)
* [ ] No ESLint errors (`npm run lint`)
* [ ] No unused imports
* [ ] Components use proper TypeScript types (no `any`)
* [ ] Responsive design tested on mobile (375px) and desktop (1280px)
* [ ] No hardcoded API URLs (use `NEXT_PUBLIC_API_URL` from env)
* [ ] No `.env.local` committed
* [ ] Images use `next/image` for optimization

---

# 6. Merge Rules

* Only merge via Pull Request
* Use **Squash and Merge**
* Delete feature branch after merge

---

# 7. Production Release Process

When releasing to production:

## Step 1 — Merge develop → main via PR

PR title:

```text
[RELEASE] Version 1.0.0
```

## Step 2 — Tag version

```bash
git checkout main
git pull origin main
git tag v1.0.0
git push origin v1.0.0
```

Versioning follows:

```text
MAJOR.MINOR.PATCH
```

Example:

* v1.0.0 → First release
* v1.1.0 → New feature
* v1.1.1 → Bug fix

---

# 8. Hotfix Process (Critical Production Bug)

## Step 1

```bash
git checkout main
git pull origin main
git checkout -b hotfix/fix-login-redirect
```

## Step 2

Fix issue and commit:

```text
fix: resolve login redirect loop on mobile
```

## Step 3

Push and create PR to:

* `main`
* `develop` (after main merge)

---

# 9. Code Quality Rules Before Push

Before pushing any code:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Ensure:

* No lint errors
* No TypeScript errors
* Build succeeds locally

---

# 10. Environment Variables Rules

* Never commit `.env.local` to Git
* All API URLs must use `process.env.NEXT_PUBLIC_API_URL`
* Add new env vars to Vercel dashboard manually

```text
NEXT_PUBLIC_API_URL=https://api.congdongviet6368.com
```

---

# 11. Forbidden Actions

❌ Force push to main or develop
❌ Push `.env.local` or any secrets
❌ Push `node_modules/` or `.next/` folder
❌ Commit directly to main or develop
❌ Hardcode API URLs in source code
❌ Use `any` type without justification

---

# 12. .gitignore Must Include

```text
node_modules/
.next/
.env.local
.env*.local
*.log
.DS_Store
.idea/
.vscode/
```

---

# 13. Repository Structure Convention

```
congdongviet-client
 ├── public/
 ├── src/
 │   ├── app/          ← Next.js pages (App Router)
 │   ├── components/   ← Reusable UI components
 │   ├── context/      ← React Context providers
 │   ├── lib/          ← API client, utilities
 │   └── types/        ← TypeScript type definitions
 ├── package.json
 └── next.config.ts
```

---

# 14. Commit Frequency Rule

* Small commits
* One logical change per commit
* Do not commit large mixed changes

Bad:

```text
feat: add search page and fix header and update styles and refactor api
```

Good:

```text
feat: add search filter by category
fix: correct header height on mobile
style: update listing card hover effect
```

---

# 15. CI/CD — Vercel Auto Deploy

* Push to `main` → auto-deploys to **production** (`congdongviet6368.com`)
* Push to `develop` → auto-deploys to **preview** (Vercel preview URL)
* All PRs → Vercel generates a preview URL for review

---

# 16. Final Principle

Code pushed to GitHub must be:

* Clean
* Typed
* Responsive
* Production-ready quality

---

END OF DOCUMENT
