# DevNotes production deployment

## Target architecture

- **Frontend:** Vercel Static Site from `client/`
- **Backend:** Render Web Service from `server/`
- **Database:** MongoDB Atlas
- **Email:** SMTP provider (Gmail App Password or transactional SMTP)
- **API routing:** Vercel proxies `/api/*` to the Render service. The browser therefore talks to the API through the same frontend origin, which keeps the HTTP-only auth cookie same-site.

Vercel supports external-origin rewrites, so `/api/*` can be proxied to a separate Render API without changing the URL shown in the browser.

## 1. Deploy the backend to Render

Push this repository to GitHub. In Render, create a **Web Service** and select the repository. Use the repository root as the Root Directory.

Build command:

```bash
npm --prefix server install
```

Start command:

```bash
npm --prefix server start
```

Health check:

```text
/api/health
```

The included `render.yaml` contains these defaults and can also be used as a Blueprint. Render web services must listen on the `PORT` environment variable and `0.0.0.0`; this project does both.

### Render environment variables

Set these in Render. **Never commit real values.**

```text
NODE_ENV=production
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<unique random secret, 32+ characters>
CLIENT_ORIGIN=https://<your-vercel-domain>
RESET_PASSWORD_ORIGIN=https://<your-vercel-domain>
COOKIE_NAME=devnotes_token
COOKIE_SAMESITE=lax
EMAIL_HOST=<SMTP host>
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<SMTP username>
EMAIL_PASSWORD=<SMTP password/app password>
EMAIL_FROM=DevNotes <your sender address>
```

Do not set a hard-coded production `PORT`; Render provides it.

After deployment, verify:

```text
https://<your-render-service>.onrender.com/api/health
```

Expected response is JSON containing `ok: true`.

## 2. Deploy the frontend to Vercel

Create a Vercel project from the same GitHub repository. Set **Root Directory** to:

```text
client
```

No build command is required because DevNotes is a static HTML/CSS/JS frontend.

The included `client/vercel.json` proxies:

```text
/api/*  →  https://devnotes-api.onrender.com/api/*
```

Therefore name the Render service `devnotes-api` if available. If Render gives the service a different hostname, change only the destination URL in `client/vercel.json`.

After the Vercel URL is known, update these Render variables to the exact Vercel origin:

```text
CLIENT_ORIGIN=https://your-project.vercel.app
RESET_PASSWORD_ORIGIN=https://your-project.vercel.app
```

For a custom domain, use that exact HTTPS origin instead.

## 3. Authentication/cookies

The browser calls `/api/...` on the Vercel origin. Vercel forwards those requests to Render. Production cookies therefore use:

```text
Secure=true
HttpOnly=true
SameSite=Lax
```

Do not switch to `SameSite=None` unless you intentionally change the architecture to direct cross-site API requests.

## 4. SEO

The public landing page contains:

- descriptive title and meta description
- canonical URL
- Open Graph metadata
- Twitter card metadata
- WebApplication structured data
- `robots.txt`
- `sitemap.xml`

Private application/auth pages are marked `noindex,nofollow,noarchive`.

If the final production domain changes from `devnotes.vercel.app`, update the canonical URL, sitemap, robots file and JSON-LD URL in `client/index.html`, `client/robots.txt` and `client/sitemap.xml`.

## 5. Production test checklist

- Landing page loads over HTTPS
- `GET /api/health` returns 200
- Register
- Login
- Refresh page and remain authenticated
- Create/edit/delete note
- Favorites/pin/archive/trash
- Categories
- Version history/restore
- JSON import/export
- Markdown export
- PDF export
- Profile update
- Change password
- Forgot password email
- Reset password link opens on the frontend
- Logout
- Mobile sidebar
- Mobile note editor
- Chrome + Edge + Firefox responsive checks

## Security checklist

- No `.env` or credentials committed
- Unique production JWT secret
- MongoDB user has only required database permissions
- Atlas network access is restricted appropriately for the chosen deployment setup
- HTTPS only in production
- Helmet security headers enabled on the API service
- HTTP-only authentication cookie
- Authentication and API rate limits enabled
- Origin checks for state-changing requests
- Production error responses do not expose stack traces
- Dependencies reviewed with `npm audit` before release
