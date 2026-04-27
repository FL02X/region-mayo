# Revalidation API Endpoint

## Overview

The `/api/revalidate` endpoint is triggered by Sanity webhooks to instantly update pages when content changes in Sanity Studio.

**Endpoint**: `POST /api/revalidate`

## How It Works

1. **Sanity publishes content** → Triggers webhook
2. **Webhook calls** `POST https://your-domain.com/api/revalidate`
3. **Endpoint verifies** the `x-sanity-token` header
4. **Endpoint revalidates** affected pages based on document type
5. **Response** returns list of revalidated paths and tags

## Security

- Requires valid `SANITY_REVALIDATION_TOKEN` in header
- Only accepts POST requests
- Returns 401 if token is invalid
- Returns 405 if wrong HTTP method is used

## Response Examples

### Successful Revalidation (200)
```json
{
  "revalidated": true,
  "paths": ["/", "/album", "/buscar"],
  "tags": ["events"],
  "timestamp": "2024-04-24T10:30:45.123Z"
}
```

### Invalid Token (401)
```json
{
  "message": "Invalid token"
}
```

### Method Not Allowed (405)
```json
{
  "message": "Method not allowed"
}
```

### Server Error (500)
```json
{
  "message": "Error revalidating",
  "error": "Error message details"
}
```

## Testing the Endpoint

### Using cURL
```bash
curl -X POST https://your-domain.com/api/revalidate \
  -H "x-sanity-token: your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "_type": "event",
    "operation": "publish"
  }'
```

### Using Postman
1. Set method to **POST**
2. URL: `https://your-domain.com/api/revalidate`
3. Headers tab: Add `x-sanity-token: your-token`
4. Body (raw JSON):
```json
{
  "_type": "event",
  "operation": "publish"
}
```

## Supported Document Types

- **event** → Revalidates: `/`, `/album`, `/buscar`
- **coro** → Revalidates: `/coros`, `/buscar`
- **templo** → Revalidates: `/templos`, `/directorio`, `/buscar`
- **pastor** → Revalidates: `/directorio`, `/buscar`
- **directiva** → Revalidates: `/directiva`, `/buscar`
- **region** → Revalidates: All main pages
- **siteSettings** → Revalidates: All main pages
- **unknown types** → Revalidates: `/` (homepage)

## Vercel Logs

Monitor revalidation activity in Vercel:
1. Go to **Deployments** → Select current deployment
2. View **Logs** tab
3. Search for "✅ Revalidated" to see successful revalidations
4. Search for "❌ Revalidation error" to see failures

## Performance

- **Execution time**: Typically < 100ms
- **Cache invalidation**: Immediate on next request
- **CDN update**: Instant for Vercel's global edge network

---

See [VERCEL_AUTO_UPDATE_SETUP.md](./VERCEL_AUTO_UPDATE_SETUP.md) for full setup instructions.
