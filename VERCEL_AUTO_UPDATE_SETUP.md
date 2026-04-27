# Automatic Data Updates on Vercel Deployment

This guide explains how the automatic data revalidation system works and how to set it up in Vercel.

## 🚀 How It Works

Your project now uses **On-Demand Revalidation** with **Sanity Webhooks** to update data when it's deployed to Vercel. This is optimized for low-traffic, free Vercel plan usage:

### 1. **On-Demand Revalidation** (Optimized for Free Plan)
- Pages are statically generated at build time (`revalidate = false`)
- NO automatic background rebuilds
- Rebuilds ONLY when webhook is triggered from Sanity
- Minimal build quota usage on free Vercel plan
- Perfect for low-traffic sites

### 2. **Sanity Webhooks** (for instant updates)
- When you publish/unpublish content in Sanity Studio, a webhook is triggered
- The webhook calls your `/api/revalidate` endpoint
- This endpoint immediately revalidates affected pages
- Updates are instant (1-2 seconds after publishing)
- Builds are only counted when you actually publish content

### 3. **How Often Does It Rebuild?**
- Initial build: When you deploy to Vercel
- Subsequent builds: Only when you publish in Sanity Studio
- Example: If you publish 5 times/day → 5 rebuilds max
- Example: If no content changes → 0 rebuilds
- **Result: Extremely low free tier usage** ✓

## 🔧 Setup Instructions

### Step 1: Set Environment Variable in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `SANITY_REVALIDATION_TOKEN`
   - **Value**: Generate a secure token (use `openssl rand -hex 32` or any strong random string)
   - **Environments**: Select all (Production, Preview, Development)

5. Redeploy your project for changes to take effect

**Example token generation**:
```bash
# On your local machine
openssl rand -hex 32
# Output: a3f5c8e2b1d9f4a7c6e1b3d5f7a9c2e4b6d8f1a3c5e7f9b1d3e5f7a9c1b3d
```

### Step 2: Configure Sanity Webhook

1. Go to your **Sanity Project Settings**: https://manage.sanity.io/projects
2. Select your project
3. Go to **API** → **Webhooks**
4. Click **Create Webhook** or **Add webhook**

**Webhook Configuration**:
- **Name**: `Vercel Revalidation`
- **URL**: `https://your-vercel-domain.com/api/revalidate`
  - Replace `your-vercel-domain.com` with your actual Vercel domain
  - Example: `https://region-mayo.vercel.app/api/revalidate`
- **Events**: Select all events:
  - ✅ Create
  - ✅ Update  
  - ✅ Publish
  - ✅ Unpublish
  - ✅ Delete
- **HTTP Headers**: Add a custom header
  - **Key**: `x-sanity-token`
  - **Value**: Paste the same token you set in Vercel

5. Click **Save**

### Step 3: Test the Webhook

1. In Sanity Studio, make a small change to any document (event, templo, coro, etc.)
2. Publish the change
3. Go to your Sanity Project Settings → **API** → **Webhooks**
4. Find your webhook and check the **Recent attempts** tab
5. You should see a successful request (HTTP 200)

To verify data updated on Vercel:
1. Visit your deployed site
2. Check if the changes appear (may take a few seconds)
3. Open browser DevTools and check the request headers - you should see fresh data

## 📊 Revalidation Strategy

### Document Type → Pages Revalidated

| Document Type | Pages Revalidated |
|---|---|
| `event` | `/`, `/album`, `/buscar` |
| `coro` | `/coros`, `/buscar` |
| `templo` | `/templos`, `/directorio`, `/buscar` |
| `pastor` | `/directorio`, `/buscar` |
| `directiva` | `/directiva`, `/buscar` |
| `region` | All main pages |
| `siteSettings` | All main pages |

When you publish a change:
- Instant revalidation via webhook (0-2 seconds)
- Fallback ISR revalidation (max 60 seconds if webhook fails)

## 🆘 Troubleshooting

### Data Still Not Updating?

**Check 1: Webhook is registered**
- Go to Sanity Project Settings → Webhooks
- Verify the webhook exists and URL is correct
- Make a test change and check "Recent attempts"

**Check 2: Environment variable is set**
```bash
# In your Vercel project, verify:
# Settings → Environment Variables
# SANITY_REVALIDATION_TOKEN should exist
```

**Check 3: Check Vercel logs**
1. In Vercel Dashboard, go to **Deployments**
2. Find the current deployment
3. Go to **Logs** tab
4. Search for "Revalidated" to see webhook activity
5. Check for error messages

**Check 4: Wait for ISR**
- Even if webhook fails, pages will revalidate in max 60 seconds
- If nothing changes after 60 seconds, the data source might be returning cached data

### Webhook Status: 401 Unauthorized

- **Cause**: Token doesn't match or is missing
- **Fix**: Double-check the `x-sanity-token` header value matches `SANITY_REVALIDATION_TOKEN` in Vercel

### Webhook not being triggered

- **Cause**: Maybe selecting the wrong events in webhook setup
- **Fix**: Make sure at least "Publish" event is checked in the webhook

## 🔐 Security Notes

- The `SANITY_REVALIDATION_TOKEN` should be a strong, random string
- Keep it secret - don't commit to version control
- Vercel environment variables are never exposed in client code
- The token is only used in HTTP headers between Sanity and your API route

## 📈 Performance Impact

- **Build time**: No impact - pages still build during deployment
- **Runtime**: Minimal - revalidation happens in the background
- **CDN**: All pages remain cached at the edge until revalidated
- **User experience**: Users always get fast static pages

## 🚀 Optional: More Frequent Revalidation

If you want faster updates without webhooks, change the revalidate value:

```typescript
// More frequent revalidation (faster updates, more rebuilds)
export const revalidate = 30;  // Every 30 seconds

// Less frequent (slower updates, fewer rebuilds)  
export const revalidate = 300; // Every 5 minutes

// On-demand only (only revalidate via webhook)
export const revalidate = 3600; // Every hour
```

But note: More frequent revalidation = higher Vercel costs due to more builds.

## 📝 Files Modified

- ✅ Created: `/app/api/revalidate/route.ts` - Webhook handler
- ✅ Updated: All main page.tsx files to include `export const revalidate = 60;`

---

**That's it!** Your data will now update automatically when deployed to Vercel. 🎉
