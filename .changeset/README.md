# Changesets

Run `pnpm changeset` to draft a changeset for the packages you modified. Changesets ship to npm via `.github/workflows/release.yml`. Apps (Next.js, MCP, workers) are in the `ignore` list and never publish.
