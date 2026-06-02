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
  httpDebug: "full",
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const SSO_LOGIN = __ENV.SSO_LOGIN || "";
const SSO_PASSWORD = __ENV.SSO_PASSWORD || "";
const USERS_COUNT = Number(__ENV.USERS_COUNT || 10);
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const HTTP_TIMEOUT = "10s";
const SLOT_DURATION_MIN = Number(__ENV.SLOT_DURATION_MIN || 30);
const SLOT_GAP_MIN = Number(__ENV.SLOT_GAP_MIN || 15);
const BOOKING_DAYS_AHEAD = Number(__ENV.BOOKING_DAYS_AHEAD || 30);
const SLOT_STRIDE = Number(__ENV.SLOT_STRIDE || 1000);
const RESOURCE_TYPES = ["meeting_room", "workspace", "device"];
const vuState = new Map();

export function setup() {
  const users =
    SSO_LOGIN && SSO_PASSWORD
      ? [loginWithCreds(SSO_LOGIN, SSO_PASSWORD)]
      : registerUsers(USERS_COUNT);

  if (!users.length || !users[0].token) {
    throw new Error(
      "SSO token is empty. Check login/register and SSO availability.",
    );
  }

  const listRes = http.get(`${BASE_URL}/api/v1/resources/list`, {
    headers: authHeaders(users[0].token),
  });

  if (listRes.status === 401 || listRes.status === 403) {
    throw new Error(
      "Unauthorized on /api/v1/resources/list. Check SSO token or gateway auth.",
    );
  }

  const resourceIdsByType = extractResourcesByType(listRes);
  const resourceTypes = RESOURCE_TYPES.filter(
    (type) => resourceIdsByType[type].length > 0,
  );
  if (!resourceTypes.length) {
    throw new Error(
      "No resources returned from /api/v1/resources/list. Seed data or check resource service.",
    );
  }

  return { users, resourceIdsByType, resourceTypes };
}

export default function (data) {
  if (!data.resourceTypes.length || !data.users.length) {
    return;
  }

  const state = getUserState(data);
  const userId =
    state.userId || __ENV.USER_ID || "51fe2d04-fa10-4855-8640-eff4f8975d52";

  maybeRefreshToken(state);

  data.resourceTypes.forEach((resourceType) => {
    const resourceId =
      state.resourceByType[resourceType] ||
      randomItem(data.resourceIdsByType[resourceType]);
    if (!resourceId) {
      return;
    }

    const slot = nextSlot(state, resourceType);
    const createRes = http.post(
      `${BASE_URL}/api/v1/bookings`,
      JSON.stringify({
        user_id: userId,
        resource_id: resourceId,
        starts_at: slot.startsAt,
        ends_at: slot.endsAt,
      }),
      { headers: authHeaders(state.token), timeout: HTTP_TIMEOUT },
    );

    check(createRes, {
      "create booking ok": (r) => [200, 201, 409].includes(r.status),
    });

    const bookingId = extractBookingId(createRes);
    if (bookingId) {
      const getRes = http.get(`${BASE_URL}/api/v1/bookings/${bookingId}`, {
        headers: authHeaders(state.token),
        timeout: HTTP_TIMEOUT,
      });
      check(getRes, { "get booking ok": (r) => r.status === 200 });

      const cancelRes = http.post(
        `${BASE_URL}/api/v1/bookings/${bookingId}/cancel`,
        null,
        { headers: authHeaders(state.token), timeout: HTTP_TIMEOUT },
      );
      check(cancelRes, { "cancel booking ok": (r) => r.status === 200 });
    }

    const resourceRes = http.get(`${BASE_URL}/api/v1/resources/${resourceId}`, {
      headers: authHeaders(state.token),
      timeout: HTTP_TIMEOUT,
    });
    check(resourceRes, { "get resource ok": (r) => r.status === 200 });
  });
}

function loginWithCreds(login, password) {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      login,
      password,
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, { "login ok": (r) => r && r.status === 200 });
  if (!res || res.status !== 200) {
    return { token: "", refreshToken: "", userId: "" };
  }

  return {
    token: res.json("access_token"),
    refreshToken: res.json("refresh_token"),
    userId: res.json("id"),
  };
}

function register() {
  const nonce = Math.floor(Math.random() * 1000000);
  const login = `loadtest_${nonce}`;
  const password = `LoadTest_${nonce}`;
  const res = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({
      login,
      password,
      name: "Load",
      surname: "Test",
      email: `loadtest_${nonce}@example.com`,
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(res, { "register ok": (r) => r && r.status === 200 });
  if (!res || res.status !== 200) {
    return { login: "", password: "" };
  }

  return { login, password };
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function getUserState(data) {
  const vuId = __VU;
  const existing = vuState.get(vuId);
  if (existing) {
    return existing;
  }

  const user = data.users[(vuId - 1) % data.users.length];
  const state = {
    token: user.token,
    refreshToken: user.refreshToken,
    userId: user.userId,
    lastRefreshAt: 0,
    baseStartMs: Date.now() + BOOKING_DAYS_AHEAD * 24 * 60 * 60 * 1000,
    slotIndexByType: {
      meeting_room: 0,
      workspace: 0,
      device: 0,
    },
    slotOffset: (vuId - 1) * SLOT_STRIDE,
    resourceByType: {},
  };

  data.resourceTypes.forEach((type) => {
    const list = data.resourceIdsByType[type];
    if (list.length) {
      state.resourceByType[type] = list[(vuId - 1) % list.length];
    }
  });

  vuState.set(vuId, state);
  return state;
}

function nextSlot(state, resourceType) {
  const slotStepMs = (SLOT_DURATION_MIN + SLOT_GAP_MIN) * 60 * 1000;
  const index = state.slotOffset + state.slotIndexByType[resourceType];
  const startsAt = new Date(
    state.baseStartMs + index * slotStepMs,
  ).toISOString();
  const endsAt = new Date(
    state.baseStartMs + index * slotStepMs + SLOT_DURATION_MIN * 60 * 1000,
  ).toISOString();
  state.slotIndexByType[resourceType] += 1;
  return { startsAt, endsAt };
}

function maybeRefreshToken(state) {
  if (!state.refreshToken) {
    return;
  }

  const now = Date.now();
  if (now - state.lastRefreshAt < REFRESH_INTERVAL_MS) {
    return;
  }

  const res = http.post(`${BASE_URL}/api/v1/auth/refresh`, null, {
    headers: {
      Authorization: `Bearer ${state.refreshToken}`,
    },
  });

  check(res, { "refresh ok": (r) => r.status === 200 });
  if (res.status === 200) {
    const newAccess = res.json("access_token");
    const newRefresh = res.json("refresh_token");
    if (newAccess) {
      state.token = newAccess;
    }
    if (newRefresh) {
      state.refreshToken = newRefresh;
    }
    state.lastRefreshAt = now;
    return;
  }

  if (SSO_LOGIN && SSO_PASSWORD) {
    const relogin = loginWithCreds(SSO_LOGIN, SSO_PASSWORD);
    if (relogin.token) {
      state.token = relogin.token;
    }
    if (relogin.refreshToken) {
      state.refreshToken = relogin.refreshToken;
    }
    if (relogin.userId) {
      state.userId = relogin.userId;
    }
  }

  state.lastRefreshAt = now;
}

function extractResourcesByType(listRes) {
  const grouped = {
    meeting_room: [],
    workspace: [],
    device: [],
  };

  if (!listRes || listRes.status !== 200) {
    return grouped;
  }

  const payload = listRes.json();
  const items = Array.isArray(payload)
    ? payload
    : payload && Array.isArray(payload.resources)
      ? payload.resources
      : [];

  items.forEach((item) => {
    const id = item.resource_id || item.uuid || item.id;
    const type = normalizeResourceType(
      item.resource_type || item.type || item.resourceType,
    );
    if (id && grouped[type]) {
      grouped[type].push(id);
    }
  });

  return grouped;
}

function normalizeResourceType(rawType) {
  if (!rawType) {
    return "";
  }

  const value = String(rawType).toLowerCase();
  if (value.includes("meeting")) {
    return "meeting_room";
  }
  if (value.includes("workspace")) {
    return "workspace";
  }
  if (value.includes("device")) {
    return "device";
  }

  return "";
}

function extractBookingId(createRes) {
  if (!createRes || (createRes.status !== 200 && createRes.status !== 201)) {
    return "";
  }

  const payload = createRes.json();
  if (payload && payload.booking && payload.booking.booking_id) {
    return payload.booking.booking_id;
  }

  return payload && (payload.booking_id || payload.id)
    ? payload.booking_id || payload.id
    : "";
}
