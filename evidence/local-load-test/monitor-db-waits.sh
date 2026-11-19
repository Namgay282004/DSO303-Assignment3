#!/usr/bin/env bash
set -euo pipefail

OUTPUT="evidence/local-load-test/db-wait-details.csv"

echo "timestamp,state,wait_event_type,wait_event,connections" > "$OUTPUT"

for i in $(seq 1 100); do
  docker exec dso303-postgres \
    psql -U dso303 \
    -d university_exams_loadtest \
    -At -F ',' \
    -c "
      SELECT
        clock_timestamp(),
        COALESCE(state, 'unknown'),
        COALESCE(wait_event_type, 'none'),
        COALESCE(wait_event, 'none'),
        COUNT(*)
      FROM pg_stat_activity
      WHERE datname = 'university_exams_loadtest'
        AND pid <> pg_backend_pid()
      GROUP BY state, wait_event_type, wait_event;
    " >> "$OUTPUT"

  sleep 0.5
done

echo "Detailed monitoring complete: $OUTPUT"
