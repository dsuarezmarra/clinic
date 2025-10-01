# LEGACY: Prisma / SQLite artifacts

This folder contains legacy scripts and a `schema.prisma` that were used when the project relied on a local SQLite + Prisma runtime. The current runtime uses Supabase/Postgres and these artifacts are kept only for reference or for one-time migration tasks.

If you need to run these scripts locally:

1. Backup your repo and environment.
2. Temporarily restore Prisma & sqlite3 dependencies in `backend/package.json`:

```json
"dependencies": {
  "@prisma/client": "<version>",
  "sqlite3": "<version>",
  ...
}
```

3. Run:

```bash
cd backend
npm install
npx prisma generate
node prisma/seed.js
```

4. After finishing, revert `package.json` to avoid leaving unnecessary runtime deps.

Notes:

- These scripts may assume a local SQLite file at `prisma/clinic.db`.
- Prefer using the Supabase copy of the DB for production workflows.
- Use `node scripts/wipe-and-seed.js` for populating the Supabase DB.

---

This file was generated automatically during cleanup on 2025-09-18.
