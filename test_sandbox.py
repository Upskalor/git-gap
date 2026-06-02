import httpx
import json

URL = "http://127.0.0.1:8001/webhooks/github"

mock_payload = {
    "ref": "refs/heads/main",
    "repository": {
        "id": 123456,
        "name": "dualloop-sandbox",
        "full_name": "developer/dualloop-sandbox"
    },
    "commits": [
        {
            "id": "abc123sha",
            "message": "test: triggered standalone webhook test successfully!",
            "timestamp": "2026-06-01T17:14:28+05:30",
            "author": {
                "name": "Pair Programmer",
                "username": "pair_prog"
            },
            "added": ["README.md"],
            "removed": [],
            "modified": []
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "X-GitHub-Event": "push"
}

print(f"Sending mock push event to local standalone sandbox: {URL}...")
try:
    response = httpx.post(URL, json=mock_payload, headers=headers, timeout=5.0)
    print(f"Response Status: {response.status_code}")
    print("Response Body:")
    print(json.dumps(response.json(), indent=2))
    print("\nSuccess! Check the 'saved_payloads/' directory inside the 'webhook/' folder for the generated JSON file.")
except Exception as e:
    print(f"Failed to reach server. Make sure you started the server via 'python main.py' in the 'webhook/' directory first! Error: {e}")
