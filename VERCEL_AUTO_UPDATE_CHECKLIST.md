# Vercel Auto-Update Setup Checklist

Follow these steps to enable automatic data updates on Vercel:

## Local Development (Optional but recommended)

- [ ] Copy `.env.local.example` to `.env.local` (if it doesn't exist)
- [ ] Add your test token to `.env.local`:
  ```
  SANITY_REVALIDATION_TOKEN=your-test-token-here
  ```
- [ ] Test locally: `npm run dev` and verify the API endpoint exists at `/api/revalidate`

## Vercel Setup (Required)

### Step 1: Add Environment Variable
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Add new variable:
  - Name: `SANITY_REVALIDATION_TOKEN`
  - Value: `openssl rand -hex 32` (or any strong random string)
  - Environments: Check all (Production, Preview, Development)
- [ ] Save
- [ ] Redeploy project

### Step 2: Configure Sanity Webhook
- [ ] Go to https://manage.sanity.io/projects
- [ ] Select your project → API → Webhooks
- [ ] Create new webhook:
  - [ ] Name: `Vercel Revalidation`
  - [ ] URL: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/revalidate`
  - [ ] Events: Check all
    - [ ] Create
    - [ ] Update
    - [ ] Publish
    - [ ] Unpublish
    - [ ] Delete
  - [ ] Custom Headers:
    - [ ] Key: `x-sanity-token`
    - [ ] Value: (same token from Step 1)
  - [ ] Save

### Step 3: Test It
- [ ] In Sanity Studio, make a small test change to any document
- [ ] Publish the change
- [ ] Go to Sanity Webhooks → Check "Recent attempts" - should show HTTP 200
- [ ] Visit your Vercel site - the change should appear within 2 seconds
- [ ] If it works, you're done! 🎉

## Troubleshooting
- [ ] Check Vercel logs if webhook fails
- [ ] Verify token matches between Vercel and Sanity
- [ ] Make sure URL uses HTTPS (not HTTP)
- [ ] Check that you're testing with "Publish" event (not just draft save)

## Next Steps
- Read `VERCEL_AUTO_UPDATE_SETUP.md` for detailed explanation
- Monitor your Vercel usage/costs if you increase revalidation frequency
- Consider setting up alerts for webhook failures
