# Deployment Guide

## Quick Deploy to Production

To deploy to Netlify production, simply run:

```bash
npm run deploy:prod
```

This command will:
1. Build your Next.js application using the standard build process
2. Let the Netlify Next.js plugin process the build and set up routing
3. Deploy to Netlify production with proper SSR and routing support

## What Happens During Deployment

1. **Build**: Runs `npm run build` which:
   - Builds the Next.js app with all necessary files
   - Creates the `.next` directory with server and static files

2. **Plugin Processing**: The `@netlify/plugin-nextjs` plugin:
   - Processes the Next.js build output
   - Sets up server-side rendering (SSR) functions
   - Configures edge functions for middleware
   - Handles routing automatically

3. **Deploy**: Uploads the processed build to Netlify production
   - Deploys the `.next` directory
   - Deploys functions from `netlify/functions`
   - Sets up edge functions for middleware

## Production URL

After successful deployment, your site will be live at:
- **Production**: https://carehaven.app

## Alternative Deployment Methods

If the main deployment script doesn't work, you can try:

```bash
# Standard deployment (uses Netlify's build process)
npm run deploy:netlify:standard

# Direct deployment (builds then deploys)
npm run deploy:netlify:direct

# Optimized deployment (with retry logic)
npm run deploy:netlify:optimized

# No-plugins fallback (if "fetch failed" / "Failed retrieving extensions"; see Troubleshooting)
npm run deploy:netlify:no-plugins
# Or with retry: npm run deploy:prod:no-plugins
```

## Troubleshooting

If deployment fails:

1. **Plugin errors**: Make sure the Next.js plugin is enabled in `netlify.toml` - it's required for routing
2. **Build timeout**: Increase timeout in `netlify.toml` if needed (currently 600 seconds)
3. **Missing files**: Ensure `.next` directory exists after build - don't use `build:netlify` which removes files the plugin needs
4. **404 errors**: If you see 404s, the Next.js plugin might not be enabled - check `netlify.toml`
5. **"fetch failed" / "other side closed" / "Failed retrieving extensions for site"**: Often caused by local network, firewall, or VPN. Try the **no-plugins fallback** (see below). Use only as a temporary workaround; properly fix by resolving network/firewall/VPN issues so standard deploy (with plugin) works.

### No-plugins fallback

When deploy fails with "fetch failed", "other side closed", or "Failed retrieving extensions for site" (typically due to local network/firewall), you can bypass the failing extension fetch by disabling plugins:

```bash
npm run deploy:netlify:no-plugins
```

Or, for manual prod with retry logic:

```bash
npm run deploy:prod:no-plugins
```

**Caveat:** With plugins disabled, the **Next.js plugin** does not run. Netlify still runs `npm run build` and deploys the publish dir (e.g. `.next` from UI), but without the plugin's SSR/routing setup. The site may 404 on client routes, miss SSR, or otherwise behave incorrectly. Use only as a **temporary** workaround.

**Proper fix:** Resolve network/firewall/VPN issues so standard deploy (with plugin) works.

## Manual Production Deploy (Standard Script + Retry)

For manual production deploys, use the standard script with retry logic:

```bash
npm run deploy:prod:manual
```

Or run the script directly:

```bash
./scripts/deploy-prod.sh
```

This script:

- Runs prerequisites (Netlify auth, Node/npm, env vars check)
- Cleans previous build, installs deps (`npm ci`), generates Prisma client
- Builds the project (`npm run build`)
- Deploys to production with **retry logic**: `NETLIFY_RETRY_COUNT=5`, `NETLIFY_RETRY_TIMEOUT=300000`, plus CDN upload settings aligned with `netlify.toml`

Retry and CDN settings match `netlify.toml` to reduce blob upload and transient failures.

## Manual Deployment Steps (raw CLI)

If you need to deploy manually without the script:

```bash
# 1. Build the project (use standard build, not build:netlify)
npm run build

# 2. Deploy to production (plugin will be used automatically)
npx netlify-cli deploy --prod --timeout=600
```

**Important**: Use `npm run build` (not `build:netlify`) because the Next.js plugin needs the full build output to process routing correctly.

## Environment Variables

Make sure these are set in your Netlify dashboard (Site settings > Environment variables):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)
- `BREVO_API_KEY` - Brevo API key for email sending (optional)
- `RESEND_API_KEY` - Resend API key for email sending (optional fallback)

## Notes

- The Next.js plugin (`@netlify/plugin-nextjs`) is **required** for proper routing and SSR
- Use `npm run build` (standard build) - don't use `build:netlify` which removes files the plugin needs
- The plugin automatically processes the build and sets up server functions and edge functions
- The `.netlifyignore` file helps reduce upload size but doesn't affect the plugin's ability to process the build
