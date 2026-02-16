# NextIntern.ai

> Internship recommendation engine — content-based + hybrid ML matching with explainability and fairness.

## Architecture

```
web/   → Next.js 14 (TypeScript, Tailwind, PWA, i18n)
api/   → Spring Boot 3.x (Java 21, REST, JWT RS256, RBAC)
recs/  → FastAPI (Python 3.11, content + hybrid scorer)
infra/ → Docker Compose, Terraform, CI/CD
```

## Quick Start (Local Dev)

### Prerequisites
- Docker Desktop (with Compose v2)
- Java 21+ (for API development)
- Python 3.11+ (for recs development)
- Node 20+ (for web development)

### Start Everything

```bash
docker-compose up --build
```

Services will be available at:
| Service | URL |
|---------|-----|
| Web (Next.js) | http://localhost:3000 |
| API (Spring Boot) | http://localhost:8080 |
| API Docs (Swagger) | http://localhost:8080/swagger-ui |
| Recs (FastAPI) | http://localhost:8000 |
| Recs Docs | http://localhost:8000/docs |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

### Health Checks

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8000/health
curl http://localhost:3000
```

## Project Structure

```
NextIntern.ai/
├── api/                          # Spring Boot REST API
│   ├── src/main/java/ai/nextintern/
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/         # Flyway migrations
│   ├── Dockerfile
│   └── pom.xml
├── recs/                         # FastAPI Recommender
│   ├── app/
│   │   ├── api/                  # Endpoints (health, recommend)
│   │   ├── core/                 # Config, HMAC auth
│   │   └── engine/               # Content scorer
│   ├── Dockerfile
│   └── requirements.txt
├── web/                          # Next.js Frontend
│   ├── Dockerfile
│   └── (scaffolded via create-next-app)
├── infra/
│   └── db/init/                  # Postgres init scripts
├── docker-compose.yml
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, Tailwind CSS, PWA, next-intl |
| Backend | Spring Boot 3.2, Java 21, JPA, Flyway |
| Auth | JWT RS256 (asymmetric), RBAC |
| Recommender | FastAPI, scikit-learn, LightFM (Phase 2) |
| Database | PostgreSQL 16, Redis 7 |
| Search | OpenSearch (Phase 1) |
| Events | AWS SQS (Phase 1) |
| Infra | Docker, GitHub Actions, AWS ECS Fargate |
| Observability | OpenTelemetry, Grafana, CloudWatch |

## Development

### API (Spring Boot)
```bash
cd api
./mvnw spring-boot:run
```

### Recs (FastAPI)
```bash
cd recs
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Web (Next.js)
```bash
cd web
npm install
npm run dev
```

## License

Proprietary — NextIntern.ai
