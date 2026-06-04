from fastapi import FastAPI
from router.webhook import router as webhook_router
app = FastAPI(title="Standalone GitHub Webhook Integration Module")

app.include_router(webhook_router)


@app.get("/")
def home():
    return {
        "status": "online",
        "message": "Standalone GitHub Webhook receiver is running!",
        "integration_endpoint": "/webhooks/github"
    }


if __name__ == "__main__":
    import uvicorn
    # Start the local development server on port 8001
    print("🚀 Starting Standalone Webhook server on http://127.0.0.1:8001...")
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
