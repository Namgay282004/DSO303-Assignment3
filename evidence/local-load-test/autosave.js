import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const students = new SharedArray('students', function () {
  return JSON.parse(open('./students.json'));
});

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 30 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
    checks: ['rate>0.95'],
  },
};

export default function () {
  const student = students[(__VU - 1) % students.length];

  const payload = JSON.stringify({
    attempt_id: student.attempt_id,
    question_id: 3,
    answer_text: `Autosave test from VU ${__VU}, iteration ${__ITER}`,
  });

  const response = http.post(
    'http://localhost:3002/api/attempts/answers',
    payload,
    {
      headers: {
        Authorization: `Bearer ${student.token}`,
        'Content-Type': 'application/json',
      },
      tags: { endpoint: 'autosave' },
      timeout: '10s',
    }
  );

  check(response, {
    'autosave HTTP 200': (r) => r.status === 200,
    'answer saved': (r) => {
      try {
        return r.json('message') === 'Answer saved';
      } catch (_) {
        return false;
      }
    },
  });

  sleep(1);
}
