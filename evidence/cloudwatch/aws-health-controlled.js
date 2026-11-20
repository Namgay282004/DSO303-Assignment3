import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 5,
  duration: "2m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

const URL =
  "http://dso303-assignment2-alb-1267647925.ap-south-1.elb.amazonaws.com/health";

export default function () {
  const response = http.get(URL, {
    timeout: "5s",
  });

  check(response, {
    "HTTP 200": (r) => r.status === 200,
  });

  sleep(1);
}
