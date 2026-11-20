import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  const response = http.get(
    "http://dso303-assignment2-alb-1267647925.ap-south-1.elb.amazonaws.com/health"
  );

  check(response, {
    "HTTP 200": (r) => r.status === 200,
  });

  sleep(1);
}
