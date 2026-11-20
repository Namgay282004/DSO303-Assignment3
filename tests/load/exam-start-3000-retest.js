import http from 'k6/http';
import { check } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const MODE = __ENV.MODE || 'validate';

const students = new SharedArray('retest students', () => {
  const content = open(
    '../../evidence/load-tests/local-exam-start/private/retest-student-tokens.csv'
  );

  return content.trim().split('\n').map((line) => {
    const comma = line.indexOf(',');

    return {
      id: Number(line.slice(0, comma)),
      token: line.slice(comma + 1).trim(),
    };
  });
});

export const status201 = new Counter('exam_start_status_201');
export const status409 = new Counter('exam_start_status_409');
export const status401 = new Counter('exam_start_status_401');
export const statusOther = new Counter('exam_start_status_other');
export const successRate = new Rate('exam_start_success_rate');
export const startDuration = new Trend('exam_start_duration', true);

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
        exam_start_success_rate: ['rate>0.99'],
      },
    }
  : {
      vus: 1,
      iterations: 1,
    };

export default function () {
  if (MODE !== 'full') {
    const response = http.get(`${BASE_URL}/api/exams`);

    check(response, {
      'validation: exam API returns 200': (r) => r.status === 200,
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
        operation: 'exam_start_retest',
        http_status: 'recorded_by_k6',
      },
    }
  );

  if (response.status === 201) {
    status201.add(1);
  } else if (response.status === 409) {
    status409.add(1);
  } else if (response.status === 401) {
    status401.add(1);
  } else {
    statusOther.add(1);
  }

  const success = response.status === 201;

  successRate.add(success);
  startDuration.add(response.timings.duration);

  check(response, {
    'exam started with HTTP 201': (r) => r.status === 201,
  });
}
