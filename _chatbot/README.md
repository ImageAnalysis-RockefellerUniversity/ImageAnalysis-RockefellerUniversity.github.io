# BIRC chatbot ("Ask BIRC")

A chat pop-up in the bottom-right corner of the website. It answers questions using the BIRC facility documents.

```
browser (GitHub Pages site)  ──POST /chat──▶  backend (FastAPI on Render)  ──▶  Claude API
        ▲   widget.js served by backend                │
        └──────────── streamed answer ◀────────────────┘   knowledge.json (all docs, cached prompt)
```

- **No vector database.** The whole document set is small (about 10k tokens), so every request sends all of it in a [prompt-cached](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) prefix. Repeat requests read it from the cache at a fraction of the normal input price.
- **Image-only documents** (the BIRC map and the scanned acknowledgement-guidelines PDF) are sent to Claude as images, so it reads them visually.
- **The documents stay private.** `database/` and the generated `backend/knowledge/` are in `.gitignore` and are never committed. The backend gets the bundle as a Render *Secret File*.

## Layout

| Path | What it is |
|---|---|
| `database/` | Source documents: PDF, ODT, DOCX, TXT/MD, PNG/JPG (**gitignored**) |
| `backend/ingest.py` | Turns `database/` into `backend/knowledge/knowledge.json` (**gitignored**) |
| `backend/app.py` | API: `POST /chat` (streaming), `GET /widget.js`, `GET /health` |
| `widget/birc-chat.js` | The pop-up itself: plain JS in a Shadow DOM, follows the site's light/dark theme |
| `include.html` | The `<script>` tag that `_quarto.yml` adds to every page |
| `render.yaml` | Render settings for the backend |

The folder name starts with `_`, so Quarto doesn't render it as site pages. The only change outside this folder is one line in `../_quarto.yml`. Comment it out to remove the pop-up from the site:

```yaml
format:
  html:
    include-after-body: _chatbot/include.html
```

## Run locally

```bash
cd _chatbot/backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env        # .env is gitignored
.venv/bin/python ingest.py                         # builds knowledge/knowledge.json
.venv/bin/uvicorn app:app --port 8000 --reload
```

In a second terminal, from the site root:

```bash
quarto preview --port 4200 --no-browser
```

Open http://localhost:4200. The chat button appears at the bottom right of every page. `include.html` points to the live Render backend; to test a local backend, temporarily change both URLs in it to `http://localhost:8000` (and change them back before committing).

> Note: `quarto preview` and `quarto render` regenerate files in `docs/`. That's normal; commit those files when you publish.

## Updating the documents

1. Add, replace or remove files in `_chatbot/database/`.
2. Run `.venv/bin/python ingest.py` and check the printed word counts. A PDF with fewer than 50 words of text is treated as a scanned image.
3. Restart the backend locally. For the live site, open the Render service's **Environment** tab, replace the contents of the `knowledge.json` Secret File with the new file, save, and redeploy.

No site re-render is needed when only the documents change.

## Deploy (Render, free tier)

**Live backend:** https://birc-chatbot.onrender.com (health check: `/health`). It's deployed from the public repo URL, so Render does **not** redeploy on push: after changing backend code, merge to `main` and click **Manual Deploy → Deploy latest commit** in Render.

To set it up from scratch:

1. Push this repo to GitHub. `database/` and `knowledge/` are left out automatically.
2. In Render, create a **New → Web Service** from this repo (Public Git Repository, branch `main`) with these settings (they're also in `render.yaml`):
   - Root Directory: `_chatbot`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`
3. Set the environment:
   - Environment variable `ANTHROPIC_API_KEY`: your key.
   - Environment variable `KNOWLEDGE_PATH`: `/etc/secrets/knowledge.json`.
   - Environment variable `ALLOWED_ORIGINS`: `https://imageanalysis-rockefelleruniversity.github.io`.
   - Environment variable `PYTHON_VERSION`: `3.12.7`.
   - **Secret File** named `knowledge.json`: paste the contents of `_chatbot/backend/knowledge/knowledge.json` (Render's limit is 1 MB for all secret files).
4. Once it's live, check `https://<your-service>.onrender.com/health`. It should return `{"ok":true,"docs":20,...}`.
5. Make sure both URLs in `include.html` are `https://<your-service>.onrender.com` and the `include-after-body` line in `_quarto.yml` is active. Then run `quarto render`, commit and push.

The free tier sleeps after about 15 minutes idle. The first question after that takes 30–60 s, and the widget shows "Waking up the assistant…" while it waits. A paid Render instance avoids the delay.

## Configuration (environment variables)

| Variable | Default | |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | required |
| `KNOWLEDGE_PATH` | `backend/knowledge/knowledge.json` | bundle built by `ingest.py` |
| `ALLOWED_ORIGINS` | the site plus `localhost:4200` and `localhost:8000` | comma-separated CORS origins |
| `CLAUDE_MODEL` | `claude-sonnet-5-5` | |
| `RATE_LIMIT` | `30` | questions per visitor IP per 10 minutes |

To change how the assistant answers (tone, scope, contact info), edit `INSTRUCTIONS` in `backend/app.py`.
