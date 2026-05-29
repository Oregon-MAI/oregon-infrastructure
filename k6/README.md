## Run the test

The script targets the API gateway on `http://localhost:8000` by default.

```powershell
k6 run k6\booking_resource.js
```

## Provide credentials (recommended)

If you want to login with an existing SSO user:

```powershell
$env:SSO_LOGIN = "user_login"
$env:SSO_PASSWORD = "user_password"
$env:USER_ID = "51fe2d04-fa10-4855-8640-eff4f8975d52"

k6 run k6\booking_resource.js
```

## Export k6 metrics to Prometheus

Run k6 with remote-write output to Prometheus:

```powershell
$env:K6_PROMETHEUS_RW_SERVER_URL = "http://localhost:9090/api/v1/write"

k6 run k6\booking_resource.js
```
