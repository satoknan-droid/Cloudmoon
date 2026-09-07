# CloudMoon InPlay on Replit

## Run locally

Start the Replit preview with:

```bash
npm run dev
```

The Replit preview serves the Worker adapter on port `5000`. The adapter calls
the existing `worker.js` entry point and keeps external HTTPS proxy requests
working in Replit's Node environment.

For Cloudflare Workers development, use:

```bash
npm run wrangler:dev
```

This runs Wrangler on its default local port `8787`.

## Notes

- The project keeps its original Cloudflare Workers structure.
- `wrangler.toml` is used for Cloudflare configuration and local development.
- Cloudflare account credentials are only needed for deployment to Cloudflare; local preview does not require them.