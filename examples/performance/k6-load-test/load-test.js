// ---------------------------------------------------------------------------
// k6 Load Test — Multiple Scenarios
// ---------------------------------------------------------------------------
// Run with: k6 run --env SCENARIO=smoke load-test.js
//
// Scenarios:
//   smoke  — 1 VU, 30s. Verifies the system works under minimal load.
//   load   — Ramp to 50 VUs over 4 minutes. Typical production traffic.
//   stress — Ramp to 200 VUs. Finds the breaking point.
//   spike  — Jump to 100 VUs instantly, then drop. Tests auto-scaling.
//
// Custom metrics:
//   api_request_duration — Trend of individual request durations
//   api_requests_total   — Counter of all requests made
//   api_success_rate     — Rate of successful (status 200/201) responses
//
// Thresholds:
//   p(95) response time under 500ms
//   Error rate below 1%
// ---------------------------------------------------------------------------

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Counter, Trend, Rate } from 'k6/metrics'

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

// Trend — tracks distribution of request durations (min, max, avg, p90, p95)
const apiRequestDuration = new Trend('api_request_duration', true)

// Counter — total number of API requests made across all VUs
const apiRequestsTotal = new Counter('api_requests_total')

// Rate — fraction of requests that returned a success status
const apiSuccessRate = new Rate('api_success_rate')

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------
// Selected at runtime via the SCENARIO env var.
// Each scenario defines VU stages (ramp-up, sustain, ramp-down).
// ---------------------------------------------------------------------------
const scenarios = {
  // Smoke test: 1 virtual user, 30 seconds
  // Purpose: sanity check that endpoints respond correctly
  smoke: {
    stages: [
      { duration: '30s', target: 1 },
    ],
  },

  // Load test: gradual ramp-up to 50 VUs, sustain, ramp-down
  // Purpose: validate performance under expected production traffic
  load: {
    stages: [
      { duration: '30s', target: 10 },   // warm up
      { duration: '1m',  target: 50 },   // ramp to load
      { duration: '2m',  target: 50 },   // sustain at peak
      { duration: '30s', target: 0 },    // ramp down
    ],
  },

  // Stress test: push to 200 VUs to find the breaking point
  // Purpose: discover capacity limits and failure modes
  stress: {
    stages: [
      { duration: '30s', target: 50 },   // warm up
      { duration: '1m',  target: 100 },  // moderate load
      { duration: '1m',  target: 200 },  // push to limit
      { duration: '2m',  target: 200 },  // sustain stress
      { duration: '30s', target: 0 },    // ramp down
    ],
  },

  // Spike test: instant jump to 100 VUs, hold briefly, drop
  // Purpose: test system reaction to sudden traffic bursts
  spike: {
    stages: [
      { duration: '10s', target: 100 },  // instant spike
      { duration: '30s', target: 100 },  // brief sustain
      { duration: '10s', target: 0 },    // sudden drop
    ],
  },
}

// ---------------------------------------------------------------------------
// k6 options — stages + thresholds
// ---------------------------------------------------------------------------
const selectedScenario = __ENV.SCENARIO || 'smoke'
const selectedStages = scenarios[selectedScenario]
  ? scenarios[selectedScenario].stages
  : scenarios.smoke.stages

export const options = {
  stages: selectedStages,

  // Thresholds define pass/fail criteria for the test run
  thresholds: {
    // Built-in metric: 95th percentile response time must be under 500ms
    http_req_duration: ['p(95)<500'],

    // Custom metric: 95th percentile of our tracked API durations under 500ms
    api_request_duration: ['p(95)<500'],

    // Custom metric: success rate must be above 99% (error rate < 1%)
    api_success_rate: ['rate>0.99'],

    // Built-in metric: fewer than 1% of requests should fail
    http_req_failed: ['rate<0.01'],
  },
}

// ---------------------------------------------------------------------------
// Base URL — the Express server started via `node server.js`
// ---------------------------------------------------------------------------
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3220'

// ---------------------------------------------------------------------------
// Default function — executed once per VU iteration
// ---------------------------------------------------------------------------
// Each virtual user runs this function in a loop for the duration of the test.
// Groups organize requests logically for the k6 summary output.
// ---------------------------------------------------------------------------
export default function () {
  // Group: Health check
  // Quick endpoint to verify the server is responsive
  group('health check', () => {
    const res = http.get(`${BASE_URL}/api/health`)

    // Record custom metrics
    apiRequestDuration.add(res.timings.duration)
    apiRequestsTotal.add(1)
    apiSuccessRate.add(res.status === 200)

    // Assertions — check() does not abort the test, it records pass/fail rates
    check(res, {
      'health: status is 200': (r) => r.status === 200,
      'health: has status field': (r) => JSON.parse(r.body).status === 'ok',
      'health: response under 200ms': (r) => r.timings.duration < 200,
    })
  })

  // Group: List users
  // Simulates browsing the user list — the most common read operation
  group('list users', () => {
    const res = http.get(`${BASE_URL}/api/users`)

    apiRequestDuration.add(res.timings.duration)
    apiRequestsTotal.add(1)
    apiSuccessRate.add(res.status === 200)

    check(res, {
      'list: status is 200': (r) => r.status === 200,
      'list: returns array': (r) => JSON.parse(r.body).data.length > 0,
      'list: response under 300ms': (r) => r.timings.duration < 300,
    })
  })

  // Group: Get single user
  // Simulates viewing a user profile — hits /api/users/1
  group('get single user', () => {
    const res = http.get(`${BASE_URL}/api/users/1`)

    apiRequestDuration.add(res.timings.duration)
    apiRequestsTotal.add(1)
    apiSuccessRate.add(res.status === 200)

    check(res, {
      'get: status is 200': (r) => r.status === 200,
      'get: has user name': (r) => JSON.parse(r.body).name !== undefined,
    })
  })

  // Group: Create user
  // Simulates a write operation — POST with a JSON body
  group('create user', () => {
    const payload = JSON.stringify({
      name: `LoadTestUser_${Date.now()}`,
      email: `load_${Date.now()}@test.com`,
    })

    const params = {
      headers: { 'Content-Type': 'application/json' },
    }

    const res = http.post(`${BASE_URL}/api/users`, payload, params)

    apiRequestDuration.add(res.timings.duration)
    apiRequestsTotal.add(1)
    apiSuccessRate.add(res.status === 201)

    check(res, {
      'create: status is 201': (r) => r.status === 201,
      'create: returns id': (r) => JSON.parse(r.body).id !== undefined,
    })
  })

  // Think time — pause between iterations to simulate real user behavior
  // Random sleep between 0.5 and 1.5 seconds
  sleep(Math.random() + 0.5)
}
