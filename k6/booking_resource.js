import http from "k6/http";
import { check, sleep } from "k6";
import { randomItem } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

export const options = {
  scenarios: {
    baseline: {
      executor: "constant-arrival-rate",
      rate: 5,
      timeUnit: "1s",
      duration: "10m",
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
    step_load: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      stages: [
        { target: 50, duration: "5m" },
        { target: 100, duration: "5m" },
        { target: 200, duration: "5m" },
        { target: 300, duration: "5m" },
      ],
      preAllocatedVUs: 200,
      maxVUs: 800,
    },
    spike: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      stages: [
        { target: 5, duration: "2m" },
        { target: 60, duration: "30s" },
        { target: 5, duration: "2m" },
      ],
      preAllocatedVUs: 50,
      maxVUs: 300,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<600", "p(99)<1500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const SSO_LOGIN = __ENV.SSO_LOGIN || "";
const SSO_PASSWORD = __ENV.SSO_PASSWORD || "";
const USERS_COUNT = Number(__ENV.USERS_COUNT || 10);

export function setup() {
  const users = SSO_LOGIN && SSO_PASSWORD ? [loginWithCreds(SSO_LOGIN, SSO_PASSWORD)] : registerUsers(USERS_COUNT);

  if (!users.length || !users[0].token) {
    throw new Error("SSO token is empty. Check login/register and SSO availability.");
  }

  const listRes = http.get(`${BASE_URL}/api/v1/resources/list`, {
    headers: authHeaders(users[0].token),
  });

  if (listRes.status === 401 || listRes.status === 403) {
    throw new Error("Unauthorized on /api/v1/resources/list. Check SSO token or gateway auth.");
  }

  const resourceIds = extractResourceIds(listRes);
  if (!resourceIds.length) {
    throw new Error("No resources returned from /api/v1/resources/list. Seed data or check resource service.");
  }

  return { users, resourceIds };
}

export default function (data) {
  if (!data.resourceIds.length || !data.users.length) {
    return;
  }

  const user = data.users[(__VU - 1) % data.users.length];
  const token = user.token;
  const userId = user.userId || __ENV.USER_ID || "51fe2d04-fa10-4855-8640-eff4f8975d52";
  const resourceId = randomItem(data.resourceIds);
  const now = new Date();
  const startsAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
  const endsAt = new Date(now.getTime() + 20 * 60 * 1000).toISOString();

  const createRes = http.post(
    `${BASE_URL}/api/v1/bookings`,
    JSON.stringify({
      user_id: userId,
      resource_id: resourceId,
      starts_at: startsAt,
      ends_at: endsAt,
    }),
    { headers: authHeaders(token) }
  );

  check(createRes, {
    "create booking ok": (r) => [200, 201, 409].includes(r.status),
  });

  const bookingId = extractBookingId(createRes);
  if (bookingId) {
    const getRes = http.get(`${BASE_URL}/api/v1/bookings/${bookingId}`, {
      headers: authHeaders(token),
    });
    check(getRes, { "get booking ok": (r) => r.status === 200 });

    const cancelRes = http.post(
      `${BASE_URL}/api/v1/bookings/${bookingId}/cancel`,
      null,
      { headers: authHeaders(token) }
    );
    check(cancelRes, { "cancel booking ok": (r) => r.status === 200 });
  }

  const resourceRes = http.get(`${BASE_URL}/api/v1/resources/${resourceId}`, {
    headers: authHeaders(token),
  });
  check(resourceRes, { "get resource ok": (r) => r.status === 200 });

  sleep(1);
}

function loginWithCreds(login, password) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      login,
      password,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(res, { "login ok": (r) => r.status === 200 });
  return { token: res.json("access_token"), userId: res.json("id") };
}

function registerUsers(count) {
  const users = [];

  for (let i = 0; i < count; i += 1) {
    const creds = register();
    const user = loginWithCreds(creds.login, creds.password);
    if (user.token) {
      users.push(user);
    }
  }

  return users;
}

function login() {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      login: SSO_LOGIN,
      password: SSO_PASSWORD,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(res, { "login ok": (r) => r.status === 200 });
  return res.json("access_token");
}

function register() {
  const nonce = Math.floor(Math.random() * 1000000);
  const res = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      login: `loadtest_${nonce}`,
      password: `LoadTest_${nonce}`,
      name: "Load",
      surname: "Test",
      email: `loadtest_${nonce}@example.com`,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  check(res, { "register ok": (r) => r.status === 200 });
  return res.json("access_token");
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function extractResourceIds(listRes) {
  if (!listRes || listRes.status !== 200) {
    return [];
  }

  const payload = listRes.json();
  const items = Array.isArray(payload)
    ? payload
    : payload && Array.isArray(payload.resources)
      ? payload.resources
      : [];

  return items
    .map((item) => item.resource_id || item.uuid || item.id)
    .filter(Boolean);
}

function extractBookingId(createRes) {
  if (!createRes || (createRes.status !== 200 && createRes.status !== 201)) {
    return "";
  }

  const payload = createRes.json();
  if (payload && payload.booking && payload.booking.booking_id) {
    return payload.booking.booking_id;
  }

  return payload && (payload.booking_id || payload.id) ? payload.booking_id || payload.id : "";
}
