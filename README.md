# Oregon

**Oregon** — учебный микросервисный проект для бронирования офисных ресурсов: переговорных комнат, рабочих мест и устройств.

Идея приложения — дать сотруднику единый интерфейс, где можно авторизоваться, посмотреть доступные ресурсы офиса, забронировать нужный слот, отменить бронь и получить уведомления о событиях по бронированию. Администратор может управлять ресурсами и их статусами: добавлять переговорки, рабочие места и устройства, выводить ресурс в обслуживание или возвращать его в доступное состояние.

## Репозитории

| Репозиторий | Стек | Назначение |
|-------------|------|------------|
| [oregon-frontend](https://github.com/Oregon-MAI/oregon-frontend) | TypeScript, React | Пользовательский интерфейс: карта офиса, выбор места/ресурса, панель бронирования |
| [oregon-api-gateway](https://github.com/Oregon-MAI/oregon-api-gateway) | Go, HTTP, gRPC clients | Единая HTTP-точка входа для frontend: адаптирует REST/JSON запросы к gRPC-сервисам и проксирует HTTP-запросы в SSO |
| [oregon_sso_service](https://github.com/Oregon-MAI/oregon_sso_service) | Python, FastAPI, PostgreSQL, JWT | Аутентификация, авторизация, роли пользователей и валидация токенов |
| [oregon-resource-service](https://github.com/Oregon-MAI/oregon-resource-service) | Go, gRPC, PostgreSQL | Управление офисными ресурсами: переговорки, рабочие места, устройства, статусы доступности |
| [oregon-booking-service](https://github.com/Oregon-MAI/oregon-booking-service) | Go, gRPC, PostgreSQL, Kafka | Создание, отмена и просмотр бронирований, проверка конфликтов и публикация событий |
| [oregon-notification-service](https://github.com/Oregon-MAI/oregon-notification-service) | Python, FastAPI, SSE, Kafka, Redis, PostgreSQL | Уведомления в реальном времени по событиям бронирований |
| [oregon-infrastructure](https://github.com/Oregon-MAI/oregon-infrastructure) | Docker Compose, Envoy, Kafka, Grafana stack | Общая инфраструктура, конфиги, миграции, gRPC-контракты и observability |
| [oregon-ci-templates](https://github.com/Oregon-MAI/oregon-ci-templates) | GitHub Actions | Общие шаблоны CI для сервисов |

## Зачем проект разделен на сервисы

Мы разделили систему на несколько независимых компонентов, чтобы:

- не смешивать разные зоны ответственности в одном приложении;
- потрогать связку `HTTP/JSON` для внешнего API и `gRPC` для внутренних сервисов;
- отдельно реализовать `SSO` и `RBAC`, а не размазывать авторизацию по бизнес-сервисам;
- использовать событийную коммуникацию через `Kafka` для уведомлений и напоминаний;
- попробовать разные технологические стеки: `Go` для высоконагруженных backend-сервисов и `Python/FastAPI` для SSO и notifications;
- добавить базовую observability: логи, метрики и распределенную трассировку.

## Основной пользовательский сценарий

1. Пользователь регистрируется или входит в систему через `SSO`.
2. Frontend отправляет запросы во внешний входной контур через `Envoy`.
3. `API Gateway` принимает HTTP/JSON запросы и вызывает внутренние gRPC-сервисы.
4. Пользователь смотрит список доступных ресурсов: переговорки, рабочие места или устройства.
5. При создании брони `booking-service` проверяет ресурс, временной интервал и возможные конфликты.
6. После успешного бронирования сервис публикует событие в `Kafka`.
7. `notification-service` читает событие из Kafka и доставляет уведомление пользователю через `Server-Sent Events`.

## Какие сервисы у нас есть

### [`oregon-frontend`](https://github.com/Oregon-MAI/oregon-frontend) — `TypeScript / React`

Клиентская часть приложения для пользователя.

- показывает карту офиса и список ресурсов;
- отображает статусы мест: свободно, занято, мое бронирование;
- дает выбрать временной слот для бронирования;
- хранит состояние пользователя и броней на стороне клиента;
- содержит защищенные маршруты для авторизованных пользователей.

### `Envoy` — reverse proxy и балансировщик

`Envoy` — первый инфраструктурный слой перед backend-сервисами.

- принимает внешний трафик на `localhost:8000`;
- балансирует запросы на `api-gateway`;
- маршрутизирует `/notifications/` напрямую в `notification-service`;
- применяет local rate limit;
- может выполнять внешнюю авторизацию через `ext_authz`, обращаясь к проверке токена в API Gateway/SSO;
- дает admin-интерфейс на `localhost:9901`.

### [`oregon-api-gateway`](https://github.com/Oregon-MAI/oregon-api-gateway) — `Go`

API Gateway — второй входной слой после Envoy и основная HTTP-фасадная часть системы.

Он нужен, потому что внешнему клиенту удобнее работать с `REST/JSON`, а внутренние бизнес-сервисы `resource` и `booking` общаются по `gRPC`. Поэтому gateway:

- принимает HTTP/JSON запросы от frontend;
- мапит REST-эндпоинты ресурсов и бронирований в gRPC-вызовы;
- проксирует auth-запросы в `SSO`, который предоставляет обычный HTTP API;
- содержит общие middleware: логирование, трассировка, обработка ошибок, проверка авторизации;
- отдает единую точку входа для API: `/api/v1/...`.

Примеры групп API:

- `/api/v1/auth/*` — регистрация, логин, refresh, validate через SSO;
- `/api/v1/resources/*` — создание, изменение, удаление и получение ресурсов;
- booking endpoints — создание, отмена и просмотр бронирований через `booking-service`.

### [`oregon_sso_service`](https://github.com/Oregon-MAI/oregon_sso_service) — `Python / FastAPI`

SSO отвечает за пользователей, роли и токены доступа.

- регистрация и вход по логину/паролю;
- выдача пары JWT-токенов: `access` и `refresh`;
- refresh и валидация токенов;
- ролевая модель `admin` / `user`;
- CRUD для пользователей и ролей;
- хранение данных в PostgreSQL;
- экспорт метрик Prometheus и трассировка через OpenTelemetry.

### [`oregon-resource-service`](https://github.com/Oregon-MAI/oregon-resource-service) — `Go / gRPC`

Resource Service хранит каталог офисных ресурсов и их состояние.

Поддерживаемые типы ресурсов:

- `meeting_room` — переговорная комната;
- `workspace` — рабочее место;
- `device` — устройство.

Что делает сервис:

- создает, обновляет и удаляет ресурсы;
- возвращает список ресурсов и фильтрует их по типу/локации;
- хранит статус ресурса: `available`, `occupied`, `maintenance`, `emergency`;
- предоставляет публичный gRPC API для gateway;
- предоставляет отдельный gRPC API для `booking-service`, чтобы бронирование могло проверять доступность и менять занятость ресурса.

### [`oregon-booking-service`](https://github.com/Oregon-MAI/oregon-booking-service) — `Go / gRPC`

Booking Service — ядро бизнес-сценария бронирования.

- создает бронь на ресурс на заданный интервал времени;
- проверяет конфликты по ресурсу и времени;
- получает информацию о ресурсе из `resource-service`;
- позволяет пользователю или администратору отменить бронь;
- возвращает бронирования пользователя или ресурса;
- хранит брони в PostgreSQL;
- использует outbox-таблицу для отложенных сообщений;
- публикует события в Kafka для уведомлений и напоминаний.

Kafka topics:

- `topic.user.booking` — пользователь создал бронь;
- `topic.user.cancel` — пользователь отменил бронь;
- `topic.admin.cancel` — администратор отменил бронь;
- `topic.messages.start` — напоминание перед началом брони;
- `topic.messages.end` — напоминание перед окончанием брони.

### [`oregon-notification-service`](https://github.com/Oregon-MAI/oregon-notification-service) — `Python / FastAPI`

Notification Service отвечает за доставку уведомлений пользователям в реальном времени.

- читает события бронирований из Kafka;
- доставляет сообщения клиенту через `Server-Sent Events`;
- хранит быстрый кэш уведомлений в Redis;
- использует PostgreSQL для трекинга отправленных сообщений и идемпотентности;
- поддерживает подтверждение прочтения уведомления.

Основные endpoints:

- `GET /notifications/{user_id}` — SSE-поток уведомлений пользователя;
- `POST /notifications/confirm/{user_id}/{message_id}` — отметить уведомление прочитанным.

## Инфраструктура

Инфраструктурный репозиторий [`oregon-infrastructure`](https://github.com/Oregon-MAI/oregon-infrastructure) содержит все, что нужно для локального запуска системы:

- `docker-compose.yaml` и compose-файлы по сервисам;
- конфиги `Envoy`, `api-gateway`, `booking-service`, `resource-service`, `Prometheus`, `Loki`, `Promtail`;
- миграции PostgreSQL для ресурсов, бронирований и outbox;
- gRPC-контракты в `contracts/proto`;
- сгенерированные Go-клиенты в `contracts/gen/go`;
- документацию по proto-контрактам в `contracts/docs`;
- provisioning для Grafana dashboards/datasources;
- Kafka + Zookeeper + Kafbat UI;
- observability стек: `Prometheus`, `Grafana`, `Jaeger`, `Loki`, `Promtail`, `Elasticsearch`.

## Текущая архитектура — C2 Container level

![oregon-arch](/docs/architecture.png)

| Контейнер | Тип | Ответственность | Основные связи |
|-----------|-----|-----------------|----------------|
| `oregon-frontend` | Web SPA | Интерфейс пользователя: карта офиса, выбор ресурса, создание и просмотр броней | `HTTP/JSON` к `Envoy` |
| `Envoy` | Edge proxy | Единая внешняя точка входа, балансировка, rate limit, маршрутизация API и SSE | `HTTP` к `api-gateway`, `HTTP SSE` к `notification-service` |
| `oregon-api-gateway` | Backend API | REST/JSON facade для frontend, маппинг HTTP-запросов в gRPC, проксирование auth-запросов | `HTTP` к `SSO`, `gRPC` к `resource` и `booking` |
| `oregon_sso_service` | Backend service | Аутентификация, JWT, refresh, роли `admin`/`user`, валидация токенов | `PostgreSQL`, `HTTP` от gateway |
| `oregon-resource-service` | Backend service | Каталог ресурсов: переговорки, рабочие места, устройства, статусы доступности | `PostgreSQL`, `gRPC` от gateway и booking |
| `oregon-booking-service` | Backend service | Создание/отмена броней, проверка конфликтов, outbox, события для уведомлений | `PostgreSQL`, `gRPC` к resource, publish в `Kafka` |
| `oregon-notification-service` | Backend service | Real-time уведомления через SSE, история уведомлений, подтверждение прочтения | consume из `Kafka`, `Redis`, `PostgreSQL`, `SSE` через Envoy |
| `Kafka` | Message broker | Асинхронная доставка событий бронирования и напоминаний | producer — `booking-service`, consumer — `notification-service` |
| `PostgreSQL` / `Redis` | Data stores | Персистентное хранение данных сервисов и быстрый кэш уведомлений | Используются соответствующими сервисами напрямую |
| `Prometheus`, `Grafana`, `Jaeger`, `Loki`, `Promtail` | Observability | Метрики, трейсы, логи и дашборды для локального окружения | Получают данные от backend-контейнеров |

## gRPC-контракты

Внутреннее взаимодействие между `api-gateway`, `resource-service` и `booking-service` описано через protobuf-контракты.

- [`contracts/proto/resource/resource.proto`](contracts/proto/resource/resource.proto) — API ресурсов;
- [`contracts/proto/booking/booking.proto`](contracts/proto/booking/booking.proto) — API бронирований;
- [`contracts/docs/resource.md`](contracts/docs/resource.md) — сгенерированная документация Resource API;
- [`contracts/docs/booking.md`](contracts/docs/booking.md) — сгенерированная документация Booking API.

Генерация Go-контрактов через `Taskfile.yml`:

```bash
task gen-go-resource
task gen-go-book
```

## Быстрый старт

```bash
git clone https://github.com/Oregon-MAI/oregon-infrastructure.git
cd oregon-infrastructure

cp env.example .env

docker compose up -d
```

После запуска доступны:

| Сервис | URL |
|--------|-----|
| Внешняя точка входа через Envoy | http://localhost:8000 |
| Envoy admin | http://localhost:9901 |
| Kafbat UI | http://localhost:8080 |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |
| Jaeger UI | http://localhost:16686 |
| Loki | http://localhost:3100 |

Логин и пароль для Grafana/Kafbat UI задаются в `.env` на основе `env.example`.

Остановка:

```bash
docker compose down
```

Полная очистка volume-ов:

```bash
docker compose down -v
```

## Что мы добавили специально для обучения

### gRPC + HTTP Gateway

Внутренние сервисы `resource` и `booking` используют gRPC-контракты, а внешний клиент работает через HTTP/JSON. Это позволило отдельно потрогать:

- protobuf-контракты;
- генерацию клиентов;
- маппинг JSON-запросов в gRPC;
- единый API Gateway поверх нескольких backend-сервисов.

### Kafka

Kafka используется для асинхронных событий бронирования:

- не блокировать создание брони отправкой уведомлений;
- отделить бизнес-логику бронирования от доставки сообщений;
- добавить напоминания о начале и окончании брони;
- показать событийное взаимодействие между сервисами.

### Observability

Мы добавили базовый observability-стек, чтобы видеть, как запрос проходит через систему:

- `Prometheus` собирает метрики;
- `Grafana` визуализирует метрики и логи;
- `Jaeger` показывает распределенные трейсы;
- `Loki` и `Promtail` собирают прикладные логи;
- `Elasticsearch` используется как storage для Jaeger в compose-окружении.

## Что получилось в MVP

В рамках MVP реализована основная ценность системы:

- единая точка входа через `Envoy` и `API Gateway`;
- регистрация, логин, роли и проверка токенов через `SSO`;
- каталог офисных ресурсов;
- создание и отмена бронирований;
- проверка конфликтов по времени;
- публикация событий в Kafka;
- real-time уведомления через SSE;
- локальная инфраструктура для запуска всего проекта одной командой;
- базовая наблюдаемость через Grafana/Prometheus/Jaeger/Loki.
