import http from "k6/http";
import { check, sleep, group } from "k6";
import {
  randomItem,
  randomIntBetween,
} from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

export const options = {
  setupTimeout: "5m",
  teardownTimeout: "1m",

  scenarios: {
    // ОСНОВНОЙ СТРЕСС-ТЕСТ: постоянная высокая нагрузка
    main_stress: {
      executor: "constant-arrival-rate",
      rate: 200, // 200 RPS постоянной нагрузки
      timeUnit: "1s",
      duration: "1h30m",
      preAllocatedVUs: 500,
      maxVUs: 2000,
      tags: { scenario: "main_stress", load_level: "high" },
    },

    // ПИКОВАЯ НАГРУЗКА: проверяем极限
    peak_load: {
      executor: "ramping-arrival-rate",
      startRate: 200,
      timeUnit: "1s",
      stages: [
        { target: 300, duration: "10m" },
        { target: 500, duration: "15m" },
        { target: 800, duration: "15m" },
        { target: 1000, duration: "10m" }, // Пик 1000 RPS
        { target: 500, duration: "10m" },
        { target: 200, duration: "10m" },
      ],
      preAllocatedVUs: 800,
      maxVUs: 3000,
      tags: { scenario: "peak_load", load_level: "extreme" },
      startTime: "1h30m", // Второй час
    },

    // БЫСТРЫЕ СПАЙКИ: проверка на резкие скачки
    spikes: {
      executor: "ramping-arrival-rate",
      startRate: 100,
      timeUnit: "1s",
      stages: [
        { target: 100, duration: "20m" },
        { target: 600, duration: "30s" }, // Быстрый спайк
        { target: 600, duration: "2m" },
        { target: 100, duration: "30s" },
        { target: 100, duration: "15m" },
        { target: 700, duration: "30s" }, // Еще один спайк
        { target: 700, duration: "2m" },
        { target: 100, duration: "30s" },
        { target: 100, duration: "20m" },
      ],
      preAllocatedVUs: 600,
      maxVUs: 2500,
      tags: { scenario: "spikes", load_level: "spike" },
      startTime: "15m", // Начинаем через 15 минут
    },
  },

  thresholds: {
    // Более мягкие пороги для стресс-теста
    http_req_failed: ["rate<0.05"], // До 5% ошибок допустимо при пике
    http_req_duration: ["p(95)<2000", "p(99)<5000"],

    // Метрики по сценариям
    "http_req_duration{scenario:main_stress}": ["p(95)<1500", "p(99)<3000"],
    "http_req_duration{scenario:peak_load}": ["p(95)<3000", "p(99)<5000"],
    "http_req_duration{scenario:spikes}": ["p(95)<2000", "p(99)<4000"],

    // Чеки успешности
    "checks{scenario:main_stress}": ["rate>0.95"],
    "checks{scenario:peak_load}": ["rate>0.90"],
    "checks{scenario:spikes}": ["rate>0.92"],
  },

  discardResponseBodies: false,
  noConnectionReuse: false,
};

// ===== КОНФИГУРАЦИЯ =====
const BASE_URL = __ENV.BASE_URL || "http://localhost:8000";
const SSO_LOGIN = __ENV.SSO_LOGIN || "";
const SSO_PASSWORD = __ENV.SSO_PASSWORD || "";
const USERS_COUNT = Number(__ENV.USERS_COUNT || 200); // Увеличил до 200

const SLOT_DURATION_MIN = 30;
const SLOT_GAP_MIN = 15;
const BOOKING_DAYS_AHEAD = 30;
const RESOURCE_TYPES = ["meeting_room", "workspace", "device"];

const vuState = new Map();
let testStartTime = Date.now();

// ===== ПРОФИЛИ ДЛЯ ВЫСОКОЙ НАГРУЗКИ =====
const USER_BEHAVIORS = [
  {
    type: "aggressive",
    weight: 30,
    avg_actions_per_session: 10,
    think_time_min: 0.1,
    think_time_max: 0.5,
  },
  {
    type: "normal",
    weight: 50,
    avg_actions_per_session: 5,
    think_time_min: 0.3,
    think_time_max: 1,
  },
  {
    type: "light",
    weight: 20,
    avg_actions_per_session: 2,
    think_time_min: 0.5,
    think_time_max: 2,
  },
];

const OPERATIONS = {
  VIEW_RESOURCES: {
    name: "view_resources",
    weight: 35,
    latency_sensitivity: "low",
  },
  CREATE_BOOKING: {
    name: "create_booking",
    weight: 30,
    latency_sensitivity: "high",
  },
  VIEW_BOOKINGS: {
    name: "view_bookings",
    weight: 20,
    latency_sensitivity: "medium",
  },
  CANCEL_BOOKING: {
    name: "cancel_booking",
    weight: 15,
    latency_sensitivity: "high",
  },
  // UPDATE_BOOKING убрал для повышения RPS
};

// ===== SETUP =====
export function setup() {
  console.log(
    `🚀 Starting 2-hour HIGH LOAD stress test at ${new Date().toISOString()}`,
  );
  console.log(`⚙️  Target: 200-1000 RPS, ${USERS_COUNT} users`);

  let users = [];
  if (SSO_LOGIN && SSO_PASSWORD) {
    users = loginWithCredsBatch(SSO_LOGIN, SSO_PASSWORD, USERS_COUNT);
  } else {
    users = registerUsersBatch(USERS_COUNT);
  }

  const validUsers = users.filter((u) => u && u.token);
  if (validUsers.length === 0) {
    throw new Error("No valid users created");
  }

  const listRes = http.get(`${BASE_URL}/api/v1/resources/list`, {
    headers: authHeaders(validUsers[0].token),
  });

  const resourceIdsByType = extractResourcesByType(listRes);
  const availableTypes = RESOURCE_TYPES.filter(
    (t) => resourceIdsByType[t]?.length > 0,
  );

  console.log(
    `✅ Setup: ${validUsers.length} users, ${availableTypes.length} resource types`,
  );
  console.log(
    `📊 Resources: ${JSON.stringify(Object.fromEntries(availableTypes.map((t) => [t, resourceIdsByType[t].length])))}`,
  );
  console.log(`🎯 Starting high-load test...`);

  return {
    users: validUsers,
    resourceIdsByType,
    resourceTypes: availableTypes,
  };
}

// ===== DEFAULT FUNCTION - ОПТИМИЗИРОВАН ДЛЯ ВЫСОКОЙ НАГРУЗКИ =====
export default function (data) {
  const elapsed = Date.now() - testStartTime;
  if (elapsed > 2 * 60 * 60 * 1000) return;

  const state = getUserState(data);
  const scenario = getCurrentScenario(elapsed);

  maybeRefreshToken(state);

  // Минимум пауз между запросами
  const behavior = state.userBehavior;
  const actionsInSession = randomIntBetween(
    1,
    behavior.avg_actions_per_session,
  );

  for (let action = 0; action < actionsInSession; action++) {
    if (Date.now() - testStartTime > 2 * 60 * 60 * 1000) break;

    const operation = selectOperation();

    // Быстрое выполнение операции
    performOperationFast(operation, state, data, scenario);

    // Минимальная задержка для высокого RPS
    const thinkTime =
      randomIntBetween(
        behavior.think_time_min * 10,
        behavior.think_time_max * 10,
      ) / 10;
    sleep(thinkTime);
  }

  // Короткая пауза между сессиями
  const sessionBreak = randomIntBetween(1, 5);
  sleep(sessionBreak);
}

// ===== БЫСТРЫЕ ОПЕРАЦИИ ДЛЯ ВЫСОКОГО RPS =====
function performOperationFast(operation, state, data, scenario) {
  switch (operation.name) {
    case "view_resources":
      viewResourcesFast(state, data, scenario);
      break;
    case "create_booking":
      createBookingFast(state, data, scenario);
      break;
    case "view_bookings":
      viewBookingsFast(state, data, scenario);
      break;
    case "cancel_booking":
      cancelBookingFast(state, data, scenario);
      break;
  }
}

function viewResourcesFast(state, data, scenario) {
  const resourceType = randomItem(data.resourceTypes);
  const res = http.get(
    `${BASE_URL}/api/v1/resources/list?type=${resourceType}&limit=10`,
    {
      headers: authHeaders(state.token),
      tags: { operation: "list", scenario, type: resourceType },
    },
  );
  check(res, { "list ok": (r) => r.status === 200 });
}

function createBookingFast(state, data, scenario) {
  const resourceType = randomItem(data.resourceTypes);
  const resourceId =
    state.resourceByType[resourceType] ||
    randomItem(data.resourceIdsByType[resourceType]);

  if (!resourceId) return;

  const slot = nextSlot(state, resourceType);

  const res = http.post(
    `${BASE_URL}/api/v1/bookings`,
    JSON.stringify({
      user_id: state.userId,
      resource_id: resourceId,
      starts_at: slot.startsAt,
      ends_at: slot.endsAt,
    }),
    {
      headers: authHeaders(state.token),
      tags: { operation: "create", scenario, resource_type: resourceType },
    },
  );

  const success = check(res, {
    "create ok": (r) => [200, 201, 409].includes(r.status),
  });

  if (success && (res.status === 200 || res.status === 201)) {
    const bookingId = extractBookingId(res);
    if (bookingId) {
      state.myBookings.push(bookingId);
      if (state.myBookings.length > 10) state.myBookings.shift();
    }
  }
}

function viewBookingsFast(state, data, scenario) {
  const res = http.get(
    `${BASE_URL}/api/v1/bookings?user_id=${state.userId}&limit=5`,
    {
      headers: authHeaders(state.token),
      tags: { operation: "get", scenario },
    },
  );
  check(res, { "get ok": (r) => r.status === 200 });
}

function cancelBookingFast(state, data, scenario) {
  if (state.myBookings.length === 0) return;

  const bookingId = randomItem(state.myBookings);
  const res = http.post(
    `${BASE_URL}/api/v1/bookings/${bookingId}/cancel`,
    null,
    {
      headers: authHeaders(state.token),
      tags: { operation: "cancel", scenario },
    },
  );

  if (res.status === 200) {
    const index = state.myBookings.indexOf(bookingId);
    if (index > -1) state.myBookings.splice(index, 1);
  }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function selectOperation() {
  const totalWeight = Object.values(OPERATIONS).reduce(
    (sum, op) => sum + op.weight,
    0,
  );
  let random = Math.random() * totalWeight;

  for (const op of Object.values(OPERATIONS)) {
    if (random < op.weight) return op;
    random -= op.weight;
  }
  return OPERATIONS.VIEW_RESOURCES;
}

function getCurrentScenario(elapsedMs) {
  const elapsedMin = elapsedMs / 60000;
  if (elapsedMin < 15) return "spikes";
  if (elapsedMin < 90) return "main_stress";
  return "peak_load";
}

function getUserState(data) {
  const vuId = __VU;
  let state = vuState.get(vuId);
  if (state) return state;

  const user = data.users[(vuId - 1) % data.users.length];
  const behavior = randomItem(USER_BEHAVIORS);

  state = {
    token: user.token,
    refreshToken: user.refreshToken,
    userId: user.userId,
    lastRefreshAt: Date.now(),
    myBookings: [],
    userBehavior: behavior,
    resourceByType: {},
    slotIndexByType: { meeting_room: 0, workspace: 0, device: 0 },
    slotOffset: (vuId - 1) * 1000,
  };

  data.resourceTypes.forEach((type) => {
    const list = data.resourceIdsByType[type];
    if (list?.length) {
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
    Date.now() + BOOKING_DAYS_AHEAD * 86400000 + index * slotStepMs,
  ).toISOString();
  const endsAt = new Date(
    Date.now() +
      BOOKING_DAYS_AHEAD * 86400000 +
      index * slotStepMs +
      SLOT_DURATION_MIN * 60000,
  ).toISOString();

  state.slotIndexByType[resourceType] += 1;
  return { startsAt, endsAt };
}

function maybeRefreshToken(state) {
  const now = Date.now();
  if (now - state.lastRefreshAt < 10 * 60 * 1000) return;

  const res = http.post(`${BASE_URL}/api/v1/auth/refresh`, null, {
    headers: { Authorization: `Bearer ${state.refreshToken}` },
  });

  if (res.status === 200) {
    const newToken = res.json("access_token");
    if (newToken) state.token = newToken;
    state.lastRefreshAt = now;
  }
}

// ===== АУТЕНТИФИКАЦИЯ =====
function loginWithCredsBatch(login, password, count) {
  const users = [];
  const batchSize = Math.min(count, 50);

  for (let i = 0; i < batchSize; i++) {
    const res = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ login: i === 0 ? login : `${login}_${i}`, password }),
      { headers: { "Content-Type": "application/json" } },
    );

    if (res.status === 200) {
      users.push({
        token: res.json("access_token"),
        refreshToken: res.json("refresh_token"),
        userId: res.json("id"),
      });
    }
  }
  return users;
}

function registerUsersBatch(count) {
  const users = [];
  const actualCount = Math.min(count, 100);

  for (let i = 0; i < actualCount; i++) {
    const nonce = Date.now() + i;
    const login = `stress_${nonce}`;
    const password = `Stress_${nonce}`;

    http.post(
      `${BASE_URL}/api/v1/auth/register`,
      JSON.stringify({
        login,
        password,
        name: "Stress",
        surname: "Test",
        email: `stress_${nonce}@test.com`,
      }),
      { headers: { "Content-Type": "application/json" } },
    );

    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ login, password }),
      { headers: { "Content-Type": "application/json" } },
    );

    if (loginRes.status === 200) {
      users.push({
        token: loginRes.json("access_token"),
        refreshToken: loginRes.json("refresh_token"),
        userId: loginRes.json("id"),
      });
    }
  }
  return users;
}

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function extractResourcesByType(listRes) {
  const grouped = { meeting_room: [], workspace: [], device: [] };
  if (listRes.status !== 200) return grouped;

  const payload = listRes.json();
  const items = Array.isArray(payload) ? payload : payload?.resources || [];

  items.forEach((item) => {
    const id = item.resource_id || item.uuid || item.id;
    const type = normalizeType(item.resource_type || item.type);
    if (id && grouped[type]) grouped[type].push(id);
  });

  return grouped;
}

function normalizeType(raw) {
  const val = String(raw).toLowerCase();
  if (val.includes("meeting")) return "meeting_room";
  if (val.includes("workspace")) return "workspace";
  if (val.includes("device")) return "device";
  return "";
}

function extractBookingId(res) {
  if (![200, 201].includes(res.status)) return "";
  const data = res.json();
  return data?.booking_id || data?.id || data?.booking?.booking_id || "";
}

// ===== ФИНАЛЬНЫЙ ОТЧЕТ =====
export function handleSummary(data) {
  console.log("\n📈 2-HOUR STRESS TEST COMPLETED");

  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const errorRate = data.metrics.http_req_failed?.values?.rate || 0;
  const p95 = data.metrics.http_req_duration?.values?.["p(95)"] || 0;
  const p99 = data.metrics.http_req_duration?.values?.["p(99)"] || 0;

  console.log(`\n📊 RESULTS SUMMARY:`);
  console.log(`   Total requests: ${totalRequests.toLocaleString()}`);
  console.log(`   Average RPS: ${(totalRequests / 7200).toFixed(1)}`);
  console.log(`   Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log(`   P95 latency: ${p95.toFixed(0)}ms`);
  console.log(`   P99 latency: ${p99.toFixed(0)}ms`);

  return {
    "stress_test_results.json": JSON.stringify(
      {
        test_duration: "2 hours",
        timestamp: new Date().toISOString(),
        target_rps: "200-1000",
        summary: {
          total_requests: totalRequests,
          avg_rps: totalRequests / 7200,
          error_rate_percent: (errorRate * 100).toFixed(2),
          p95_latency_ms: p95,
          p99_latency_ms: p99,
        },
      },
      null,
      2,
    ),
  };
}
