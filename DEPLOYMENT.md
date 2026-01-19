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
```

## Troubleshooting

If deployment fails:

1. **Plugin errors**: Make sure the Next.js plugin is enabled in `netlify.toml` - it's required for routing
2. **Build timeout**: Increase timeout in `netlify.toml` if needed (currently 600 seconds)
3. **Missing files**: Ensure `.next` directory exists after build - don't use `build:netlify` which removes files the plugin needs
4. **404 errors**: If you see 404s, the Next.js plugin might not be enabled - check `netlify.toml`

## Manual Deployment Steps

If you need to deploy manually:

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
