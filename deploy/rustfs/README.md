# RustFS file storage — server setup

Student photos, generated reports (Days 2–4, 6, 7) and MyGov certificates are stored in
[RustFS](https://rustfs.com), an S3-compatible object store running on the app server.
Students no longer paste Google Drive links: generated PDFs are attached automatically.
The final Report Book is unchanged (students still submit a link).

**Limits:** photos 2 MB each (compressed automatically when possible), PDFs 10 MB each.

```
Browser ──▶ Next.js /api/uploads (auth, compress)  ──▶ RustFS 127.0.0.1:9000
Browser ◀── Next.js /api/files/…  (auth, stream)   ◀── RustFS
```

RustFS listens on `127.0.0.1` only. Files are never public: every download goes through
`/api/files/…`, which allows students to read only their own files and lets
admins, faculty mentors and student leads read student files for evaluation.

> **Deploy order matters.** Do steps 1–5 on the server *before* pushing the code to `main`
> (pushing deploys automatically). Without storage configured, uploads fail with
> "File uploads are temporarily unavailable".

## 1. Install Docker (skip if already installed)

```bash
curl -fsSL https://get.docker.com | sudo sh
```

## 2. Create the data directory

The RustFS container runs as UID 10001, so it must own the data folder.

```bash
sudo mkdir -p /srv/rustfs/data
sudo chown -R 10001:10001 /srv/rustfs/data
```

## 3. Set credentials

```bash
cd /var/www/Intern/deploy/rustfs
cp rustfs.env.example rustfs.env
nano rustfs.env   # use: openssl rand -hex 16 (access key) and openssl rand -hex 32 (secret key)
chmod 600 rustfs.env
```

`rustfs.env` is git-ignored, and `git reset --hard` during deploys leaves it in place.

## 4. Start RustFS

```bash
docker compose up -d
docker compose ps          # should show "healthy" after ~30 s
docker compose logs -f     # Ctrl+C to exit
```

## 5. Point the app at RustFS

Add to `/var/www/Intern/my-app/.env` (same access/secret key as `rustfs.env`):

```bash
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_BUCKET=uploads
S3_ACCESS_KEY=<access key>
S3_SECRET_KEY=<secret key>
S3_FORCE_PATH_STYLE=true
```

The bucket is created automatically on the first upload. Restart the app so it picks up the variables:

```bash
pm2 restart intern --update-env
```

## 6. Allow larger uploads in nginx

The app accepts photos up to **2 MB** (larger ones are compressed in the browser first) and
PDFs up to **10 MB**. nginx's default request limit is **1 MB**, which would reject most
PDFs with "413 Request Entity Too Large". In the site's `server { … }` block:

```nginx
client_max_body_size 12m;
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 7. Check it works

1. Log in as a student, open a daily task, upload a photo — it should show **Saved** with a preview.
2. Generate a report — it should show **report saved** with an **Open** button.
3. Open the same day as an admin in **Evaluate**; the report link should open the PDF.

## Operations

**Web console** (browse buckets/files): from your laptop run
`ssh -L 9001:127.0.0.1:9001 <user>@<server>`, then open http://localhost:9001 and log in with the
access/secret key.

**Backups:** everything lives in `/srv/rustfs/data`. Include it in the server backup, e.g.

```bash
sudo tar -czf /backup/rustfs-$(date +%F).tar.gz -C /srv/rustfs data
```

**Storage layout:** `students/<ID>/day<N>/<purpose>/<timestamp>-<random>.<jpg|pdf>`

**Upgrading RustFS:** change the image tag in `docker-compose.yml`, then
`docker compose pull && docker compose up -d`.

## Local development

Run the same compose file locally (adjust the volume path if needed), then set the `S3_*`
variables in `my-app/.env` with `S3_ENDPOINT=http://127.0.0.1:9000`.
