# Mercado Quest repository rules

## Release workflow

A user-facing change is not complete until all of the following succeed:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Commit the completed change and push it to `main`.
4. Run `npm run deploy` to deploy the current build to the Cloudflare Worker.
5. Verify `https://mercado-quest.nostromohq.workers.dev` serves the newly generated asset bundle and the changed behavior.

Do not report a change as live after only pushing to GitHub.
