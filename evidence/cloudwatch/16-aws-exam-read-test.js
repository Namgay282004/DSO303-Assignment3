import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL =
  'http://dso303-assignment2-alb-1267647925.ap-south-1.elb.amazonaws.com';

export const options = {
  vus: 5,
  duration: '60s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/exams`, {
    timeout: '10s',
  });

  check(res, {
    'HTTP 200': (r) => r.status === 200,
    'Valid exam list': (r) => {
      try {
        return Array.isArray(r.json());
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
