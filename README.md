# 📦 Standalone Webhook Sandbox Spare Part

This is an isolated, lightweight, and database-independent GitHub Webhook receiver. When it receives a `push` trigger event from GitHub, it parses and logs the key details, then automatically generates a simplified JSON payload and saves it locally in the `saved_payloads/` directory using the naming convention:
`reponame_day_date_time.json`

## 📂 Naming Format
* **Format:** `{repo_name}_{day_name}_{date_str}_{time_str}.json`
* **Example:** `dualloop_Monday_2026-06-01_17-14-28.json`

## 🗃️ Saved JSON Payload Structure
```json
{
  "repository": "owner/repo_name",
  "total_commits": 1,
  "commits": [
    {
      "commit_message": "feat: added diagnostics telemetry page and charts",
      "timestamp": "2026-06-01T15:57:33+05:30",
      "author": "Developer Name"
    }
  ]
}
```

---

## 🚀 How to Run the Standalone Sandbox

### 1. Install Dependencies
Ensure you have `fastapi` and `uvicorn` installed. If you are already inside your Python virtual environment:
```bash
pip install fastapi uvicorn
```

### 2. Start the Server
Navigate to this folder and run the `main.py` script:
```bash
cd webhook
python main.py
```
The sandbox server will start running on **`http://127.0.0.1:8001`** (a separate port to avoid conflicts with your production FastAPI server running on `8000`).

### 3. Expose the Server with ngrok
To allow GitHub to send events to your local machine, open another terminal and expose port `8001`:
```bash
ngrok http 8001
```
Copy the secure `https://...ngrok-free.app` (or `.dev`) URL.

### 4. Configure GitHub Webhook
* **Payload URL:** `https://<YOUR-NGROK-SUBDOMAIN>.ngrok-free.app/webhooks/github`
* **Content type:** `application/json`
* **Secret:** (Set your webhook secret in `GITHUB_WEBHOOK_SECRET` environment variable to verify signatures, or leave blank to skip signature validation).
* **Which events:** Select "Just the push event".

---

## 💾 Output Location
All successfully parsed push event JSON files will be written to:
`f:\dualloop\webhook\saved_payloads/`
