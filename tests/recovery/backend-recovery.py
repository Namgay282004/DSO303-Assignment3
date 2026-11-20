import subprocess
import time
import json
import http.client
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError, HTTPError

OUT = Path("evidence/recovery-tests/local-backend")
OUT.mkdir(parents=True, exist_ok=True)

URL = "http://localhost:3001/api/db-health"

def timestamp():
    return datetime.now(timezone.utc).isoformat()

def probe():
    try:
        with urlopen(URL, timeout=2) as response:
            if response.status != 200:
                return False
            data = json.load(response)
            return data.get("status") == "connected"
    except (
        URLError,
        HTTPError,
        TimeoutError,
        ConnectionError,
        http.client.HTTPException,
        OSError
    ):
        return False

print("===== PRE-FAILURE CHECK =====", flush=True)

if not probe():
    raise SystemExit("ERROR: Backend/database not healthy")

failure_time = timestamp()
start = time.monotonic()

print("Failure started:", failure_time, flush=True)

try:
    subprocess.run(
        ["docker", "stop", "--time", "5", "dso303-backend"],
        check=True,
        timeout=20
    )

    failed = not probe()
    print("API unavailable:", failed, flush=True)

    if not failed:
        raise RuntimeError("Failure not confirmed")

    time.sleep(5)

finally:
    print("Restarting backend...", flush=True)
    subprocess.run(
        ["docker", "start", "dso303-backend"],
        check=True,
        timeout=30
    )

restored = False
restore_time = None
rto_seconds = None

for attempt in range(120):
    if probe():
        restored = True
        restore_time = timestamp()
        rto_seconds = round(time.monotonic() - start, 3)
        break
    time.sleep(1)

result = {
    "environment": "local Docker",
    "scenario": "backend stop and restart",
    "failure_started_utc": failure_time,
    "first_healthy_response_utc": restore_time,
    "failure_confirmed": failed,
    "recovery_confirmed": restored,
    "observed_rto_seconds": rto_seconds,
    "rto_target_seconds": 3600,
    "rto_pass": restored and rto_seconds <= 3600
}

path = OUT / "04-backend-recovery-retest.json"
path.write_text(json.dumps(result, indent=2) + "\n")

print("\n===== RECOVERY RESULTS =====")
print(json.dumps(result, indent=2))

if not restored:
    raise SystemExit("ERROR: Recovery not confirmed")
