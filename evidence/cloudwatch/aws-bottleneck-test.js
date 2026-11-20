import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL =
  'http://dso303-assignment2-alb-1267647925.ap-south-1.elb.amazonaws.com';

export const options = {
  scenarios: {
    controlled_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/health`, {
    timeout: '5s',
  });

  check(response, {
    'HTTP 200': (r) => r.status === 200,
  });

  sleep(1);
}
