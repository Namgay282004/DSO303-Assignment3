import http from 'k6/http';
import { check } from 'k6';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const MODE = __ENV.MODE || 'pilot';

const students = new SharedArray('peak students', function () {
  const content = open(
    '../../evidence/load-tests/local-exam-start/private/student-tokens.csv'
  );

  return content.trim().split('\n').map((line) => {
    const comma = line.indexOf(',');
    return {
      id: Number(line.slice(0, comma)),
      token: line.slice(comma + 1).trim(),
    };
  });
});

export const options = MODE === 'full'
  ? {
      scenarios: {
        exam_starts: {
          executor: 'constant-arrival-rate',
          rate: 10,
          timeUnit: '1s',
          duration: '5m',
          preAllocatedVUs: 30,
          maxVUs: 100,
        },
      },
      thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<1000'],
      },
    }
  : {
      vus: 1,
      iterations: 1,
    };

export default function () {
  if (MODE === 'pilot') {
    const response = http.get(`${BASE_URL}/api/exams`);

    check(response, {
      'pilot: exam API returns 200': (r) => r.status === 200,
    });

    return;
  }

  const index = exec.scenario.iterationInTest;

  if (index >= students.length) {
    return;
  }

  const student = students[index];

  const response = http.post(
    `${BASE_URL}/api/attempts`,
    JSON.stringify({ exam_id: 1 }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${student.token}`,
      },
      tags: {
        operation: 'exam_start',
      },
    }
  );

  check(response, {
    'exam started successfully': (r) => r.status === 201,
  });
}
