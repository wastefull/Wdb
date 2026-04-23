Migration path: Once v6.0.4 ships as stable, we upgrade glide-data-grid and can likely drop the shim entirely — but only after verifying their internal marked call is now compatible with v18's string | Promise<string> return type (v16's API is similar to v18's, so it probably is).

The blocker removing the shim today is that 6.0.3 is the latest stable release. The shim should be considered temporary scaffolding tied to that upgrade. When 6.0.4 drops, the sequence would be:

npm install @glideapps/glide-data-grid@latest --legacy-peer-deps
Remove the marked alias from vite.config.ts
Delete marked.ts
Verify build — if glide-data-grid's internal marked call is now typed correctly, TypeScript will be happy without the shim
