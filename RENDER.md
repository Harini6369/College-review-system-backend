# Deploy backend on Render

## Fix `cargo build` and `/opt/render/project/src`

Your logs mean the **Render Dashboard** is misconfigured (Blueprint alone does not fix an old service until settings match).

### Step 1 — Service settings

**Settings → Build & Deploy**

| Field | Correct value |
|--------|----------------|
| **Root Directory** | *(empty — not `src`)* |
| **Runtime** | **Node** (not Rust / Docker unless you use our Dockerfile) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Pre-Deploy Command** | `npm run seed` |

Delete **`cargo build --release`** from Build Command.

### Step 2 — Use Blueprint (recommended)

1. Push `render.yaml` from this repo root to GitHub.
2. Render → **New → Blueprint** → select repo `College-review-system-backend`.
3. Or open existing service → **Settings → Blueprint** → sync from `render.yaml`.

`render.yaml` uses `preDeployCommand` (not `releaseCommand`) to seed users from env vars on each deploy.

### Step 3 — Environment variables

Set the same values as local `.env` (lines 12–23): `MONGODB_URI`, `JWT_SECRET` (32+ chars), `ADMIN_*`, `SEED_*` emails/passwords.

Atlas: **Network Access → Allow access from anywhere** (or Render outbound IPs).

### Step 4 — Frontend (separate repo)

Deploy `College-review-system-frontend` as a **Static Site** using its `render.yaml`. Set `VITE_API_URL` to your backend `https://….onrender.com`.

Local seed anytime:

```bash
npm run seed
```
