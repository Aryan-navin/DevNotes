# DevNotes

DevNotes is a developer-focused knowledge workspace for saving programming concepts, code snippets, debugging solutions, commands, resources and ideas.

## V40 final feature set

- Secure registration, login, logout and password reset
- HTTP-only JWT authentication
- Notes with types, categories, tags, favorites, pinning, archive and trash
- Markdown editor with live preview and code-block tools
- Draft recovery and keyboard shortcuts
- Note version history and restore
- JSON and Markdown import/export
- PDF export
- Profile settings, theme persistence and password change
- Responsive desktop/mobile UI
- Production security and deployment configuration
- SEO-ready public landing page

## Structure

```text
DevNotes/
├── client/              # Vercel static frontend
├── server/              # Render Node/Express API
├── docs/DEPLOYMENT.md
├── render.yaml
└── README.md
```

## Local development

### Backend

```bash
cd server
npm install
npm run dev
```

The local API runs on `http://127.0.0.1:5000`.

### Frontend

Serve `client/` with VS Code Live Server or another local static server. The local frontend automatically uses `http://127.0.0.1:5000/api`.

## Production architecture

```text
Browser
   │
   ▼
Vercel (client/)
   │  /api/* rewrite
   ▼
Render (server/)
   │
   ▼
MongoDB Atlas
```

The browser keeps the API URL as `/api`, while Vercel proxies it to the Render service. This gives the app a single public frontend origin while keeping the backend on Render.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Environment

Copy `server/.env.example` into a private `server/.env` for local development. Never commit `.env`, JWT secrets, database credentials or SMTP credentials.

## Feature freeze

V40 is feature-complete. Future changes should be limited to bug fixes, accessibility, UI polish, security, performance and production operations.
