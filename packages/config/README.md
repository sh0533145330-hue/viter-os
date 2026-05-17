# @vita/config

Zod-validated environment variable loader. Apps and workers declare their schema once via `loadEnv(z.object({ ... }))` and crash loud on missing or invalid values. Cascades `.env.local` → `.env.<NODE_ENV>` → `.env`.
