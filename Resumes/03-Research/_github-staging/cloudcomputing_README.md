# CC_Monolith — Monolithic E-Commerce Service

> Cloud Computing project: a **monolithic** e-commerce backend (auth · cart · checkout · products)
> with load testing — a baseline architecture for comparison against microservices.

## Modules
- **auth** — user authentication (DAO + SQLite `auth.db`)
- **products** — product catalog (DAO + `products.db`)
- **cart** — cart management (DAO + `carts.db`)
- **checkout** — order/checkout flow
- **main.py** — application entry point

## Load testing
Locust scenarios under `locust/` (`login`, `browse`, `get-cart`, `checkout`, `insert_product`)
to measure throughput/latency of the monolith.

## Run
```bash
pip install -r requirements.txt   # Flask/FastAPI + SQLite
python main.py
# load test:
locust -f locust/checkout-locustfile.py
```

## Stack
Python · SQLite · Locust · DAO pattern · monolithic architecture
