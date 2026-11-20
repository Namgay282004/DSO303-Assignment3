import json
import time
import subprocess
import http.client
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

OUT = Path("evidence/recovery-tests/local-postgres")
OUT.mkdir(parents=True, exist_ok=True)

TOKEN_PATH = Path(
    "evidence/recovery-tests/local-backend/private/"
    "recovery-student-token.txt"
)

TOKEN = TOKEN_PATH.read_text().strip()

ANSWER_URL = "http://localhost:3001/api/attempts/9011/answers"
DB_URL = "http://localhost:3001/api/db-health"
EXPECTED = "A3-RPO-TEST-9011-COMMITTED-ANSWER"

def now():
    return datetime.now(timezone.utc).isoformat()

def request_json(url, authenticated=False):
    try:
        headers = {}
        if authenticated:
            headers["Authorization"] = f"Bearer {TOKEN}"

        request = Request(url, headers=headers)

        with urlopen(request, timeout=3) as response:
            return response.status, json.load(response)

    except (
        URLError,
        HTTPError,
        TimeoutError,
        ConnectionError,
        http.client.HTTPException,
        OSError,
        ValueError
    ):
        return None, None

def db_healthy():
    status, data = request_json(DB_URL)
    return (
        status == 200
        and isinstance(data, dict)
        and data.get("status") == "connected"
    )

def answer_recovered():
    status, data = request_json(
        ANSWER_URL,
        authenticated=True
    )

    return (
        status == 200
        and isinstance(data, list)
        and any(
            answer.get("question_id") == 1
            and answer.get("answer_text") == EXPECTED
            for answer in data
        )
    )

print("===== PRE-FAILURE CHECK =====", flush=True)

if not db_healthy() or not answer_recovered():
    raise SystemExit(
        "ERROR: Database or saved answer unavailable. "
        "No failure injected."
    )

print("PASS: Database healthy", flush=True)
print("PASS: Committed exam answer available", flush=True)

failure_started = now()
start = time.monotonic()
failure_confirmed = False

try:
    print("Failure started:", failure_started, flush=True)

    subprocess.run(
        ["docker", "stop", "--timeout", "5", "dso303-postgres"],
        check=True,
        timeout=20
    )

    failure_confirmed = not db_healthy()
    print("Database unavailable:", failure_confirmed, flush=True)

    if not failure_confirmed:
        raise RuntimeError("Database outage not confirmed")

    time.sleep(5)

finally:
    print("Restarting PostgreSQL...", flush=True)
    subprocess.run(
        ["docker", "start", "dso303-postgres"],
        check=True,
        timeout=30
    )

restored_at = None
rto_seconds = None
recovered = False

for _ in range(120):
    if db_healthy() and answer_recovered():
        recovered = True
        restored_at = now()
        rto_seconds = round(time.monotonic() - start, 3)
        break

    time.sleep(1)

result = {
    "environment": "local Docker",
    "scenario": "PostgreSQL container outage and restart",
    "attempt_id": 9011,
    "question_id": 1,
    "failure_started_utc": failure_started,
    "answer_restored_utc": restored_at,
    "failure_confirmed": failure_confirmed,
    "answer_recovered": recovered,
    "observed_rto_seconds": rto_seconds,
    "rto_target_seconds": 3600,
    "rto_pass": recovered and rto_seconds <= 3600,
    "committed_answer_loss_observed": not recovered,
    "rpo_assessment": (
        "No loss of tested committed answer observed"
        if recovered else "Recovery not verified"
    )
}

path = OUT / "01-postgres-recovery.json"
path.write_text(json.dumps(result, indent=2) + "\n")

print("\n===== POSTGRESQL RECOVERY RESULTS =====", flush=True)
print(json.dumps(result, indent=2), flush=True)

if not recovered:
    raise SystemExit(
        "ERROR: Database or answer recovery not confirmed"
    )
