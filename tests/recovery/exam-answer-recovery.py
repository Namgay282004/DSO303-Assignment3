import json
import time
import subprocess
import http.client
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

OUT = Path("evidence/recovery-tests/local-backend")
TOKEN = (OUT / "private/recovery-student-token.txt").read_text().strip()

URL = "http://localhost:3001/api/attempts/9011/answers"
EXPECTED = "A3-RPO-TEST-9011-COMMITTED-ANSWER"

def now():
    return datetime.now(timezone.utc).isoformat()

def get_answer():
    try:
        request = Request(
            URL,
            headers={"Authorization": f"Bearer {TOKEN}"}
        )

        with urlopen(request, timeout=2) as response:
            if response.status != 200:
                return False

            answers = json.load(response)

            return any(
                answer.get("question_id") == 1
                and answer.get("answer_text") == EXPECTED
                for answer in answers
            )

    except (
        URLError,
        HTTPError,
        TimeoutError,
        ConnectionError,
        http.client.HTTPException,
        OSError,
        ValueError
    ):
        return False

print("===== PRE-FAILURE ANSWER CHECK =====", flush=True)

if not get_answer():
    raise SystemExit(
        "ERROR: Saved answer unavailable before failure. "
        "Check JWT validity. No failure injected."
    )

print("PASS: Original exam answer retrieved", flush=True)

failure_started = now()
start = time.monotonic()
failure_confirmed = False
recovered = False
restored_at = None
rto_seconds = None

try:
    print("Failure started:", failure_started, flush=True)

    subprocess.run(
        ["docker", "stop", "--timeout", "5", "dso303-backend"],
        check=True,
        timeout=20
    )

    failure_confirmed = not get_answer()
    print("API unavailable:", failure_confirmed, flush=True)

    if not failure_confirmed:
        raise RuntimeError("Backend outage not confirmed")

    time.sleep(5)

finally:
    print("Restarting backend...", flush=True)
    subprocess.run(
        ["docker", "start", "dso303-backend"],
        check=True,
        timeout=30
    )

for _ in range(120):
    if get_answer():
        recovered = True
        restored_at = now()
        rto_seconds = round(time.monotonic() - start, 3)
        break
    time.sleep(1)

result = {
    "environment": "local Docker",
    "scenario": "backend outage with exam-answer recovery",
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
        "No loss of the tested committed answer observed"
        if recovered else "Recovery not verified"
    )
}

path = OUT / "08-exam-answer-recovery.json"
path.write_text(json.dumps(result, indent=2) + "\n")

print("\n===== EXAM ANSWER RECOVERY RESULTS =====")
print(json.dumps(result, indent=2))

if not recovered:
    raise SystemExit("ERROR: Exam answer recovery not confirmed")
