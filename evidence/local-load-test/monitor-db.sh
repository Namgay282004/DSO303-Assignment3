#!/usr/bin/env bash
set -euo pipefail

OUTPUT="evidence/local-load-test/db-activity.csv"

echo "timestamp,connections,active,waiting,lock_waiting" > "$OUTPUT"

for i in $(seq 1 65); do
  docker exec dso303-postgres \
    psql -U dso303 \
    -d university_exams_loadtest \
    -At -F ',' \
    -c "
      SELECT
        clock_timestamp(),
        COUNT(*),
        COUNT(*) FILTER (WHERE state = 'active'),
        COUNT(*) FILTER (WHERE wait_event_type IS NOT NULL),
        COUNT(*) FILTER (WHERE wait_event_type = 'Lock')
      FROM pg_stat_activity
      WHERE datname = 'university_exams_loadtest'
        AND pid <> pg_backend_pid();
    " >> "$OUTPUT"

  sleep 1
done

echo "Database monitoring completed: $OUTPUT"
