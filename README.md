# College Review System API

REST API for a college review platform. Authenticated users can review colleges. Admins manage the college catalog and can moderate reviews. Ratings are calculated from stored review documents with MongoDB aggregations.

This is a backend assessment project. It is structured for local development, automated testing, and Docker-based evaluation. It is not a complete production deployment.

## Technology stack

- Node.js 24 with Express.js and native ES modules (`import` / `export`)
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing
- Joi request validation
- Jest and Supertest integration tests
- Docker and Docker Compose
- Swagger UI / OpenAPI 3 and a Postman collection

## Prerequisites

- Node.js 24 or later
- npm 10 or later
- MongoDB 6+ if you run the API outside Docker
- Docker and Docker Compose if you use the container setup

## Installation and configuration

```bash
cd College-review-system-backend
cp .env.example .env
# Edit .env and replace JWT_SECRET and ADMIN_PASSWORD
npm install
```

`.env` is gitignored. Never commit real secrets.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | no | `development`, `test`, or `production` |
| `PORT` | no | API port. Default `3000` |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Signing secret, at least 32 characters |
| `JWT_EXPIRES_IN` | no | Access token lifetime. Default `1d` |
| `BCRYPT_SALT_ROUNDS` | no | Hash cost. Default `12` |
| `CORS_ORIGIN` | no | `*` or a comma-separated origin list |
| `RATE_LIMIT_WINDOW_MS` | no | Auth rate-limit window. Default `900000` |
| `RATE_LIMIT_MAX` | no | Max auth attempts per window. Default `10` |
| `ADMIN_NAME` | no | Seeded admin name |
| `ADMIN_EMAIL` | no | Seeded admin email |
| `ADMIN_PASSWORD` | seed only | Seeded admin password |
| `SEED_TEACHER_EMAIL` | no | Sample teacher email |
| `SEED_TEACHER_PASSWORD` | no | Sample teacher password |
| `SEED_STUDENT_EMAIL` | no | Sample student email |
| `SEED_STUDENT_PASSWORD` | no | Sample student password |
| `SEED_STUDENT_TWO_EMAIL` | no | Second sample student email |
| `SEED_STUDENT_TWO_PASSWORD` | no | Second sample student password |

## How to run the API

```bash
npm run dev    # nodemon, development
npm start      # node src/server.js
```

The process waits and retries if MongoDB is not ready yet.

Health check: `POST http://localhost:5000/health` with an empty JSON body `{}`

## Seed instructions

```bash
npm run seed
```

The script is idempotent. Re-running it updates existing seeded reviews in place and does not create duplicate users, colleges, or reviews.

It creates:

- one Admin from `ADMIN_*` variables
- one Teacher and two Students
- four sample colleges
- sample reviews used for aggregation checks

Passwords are hashed with bcrypt before they are stored. Public registration cannot create Admin accounts.

If a seeded user already exists, the script does not rotate that user's password. Change the email or delete the user if you need a new password.

## Docker setup

```bash
cp .env.example .env
# Set JWT_SECRET and ADMIN_PASSWORD in .env
docker compose up --build
```

Compose starts:

- `api` on port `3000`
- `mongo:7` with a named volume `mongo_data`
- a MongoDB health check
- API startup that waits for MongoDB readiness

Secrets are injected at runtime. They are not baked into the image.

Seed inside the running API container:

```bash
docker compose exec api npm run seed
```

## How to run tests and coverage

Tests use an in-memory MongoDB. They do not touch development or production data.

```bash
npm test
npm run test:coverage
```

Coverage is written to `coverage/`.

## API endpoint summary

All application routes under `/api` use **POST** with a JSON body. Swagger UI and `/openapi.json` remain GET for browser access.

| Method | Path | Body (examples) | Access |
| --- | --- | --- | --- |
| `POST` | `/health` | `{}` | Public |
| `POST` | `/api/auth/register` | `{ name, email, password, role? }` | Public, teacher/student only |
| `POST` | `/api/auth/login` | `{ email, password }` | Public, rate limited |
| `POST` | `/api/auth/me` | `{}` | Authenticated |
| `POST` | `/api/colleges/list` | `{ page?, limit?, search?, location?, sortBy?, sortOrder? }` | Public |
| `POST` | `/api/colleges/get` | `{ id }` | Public |
| `POST` | `/api/colleges/create` | `{ name, description, location, website? }` | Admin |
| `POST` | `/api/colleges/update` | `{ id, name?, description?, location?, website? }` | Admin |
| `POST` | `/api/colleges/delete` | `{ id }` | Admin |
| `POST` | `/api/colleges/reviews/list` | `{ collegeId, page?, limit?, ... }` | Public |
| `POST` | `/api/colleges/reviews/create` | `{ collegeId, rating, comment }` | Authenticated |
| `POST` | `/api/reviews/list` | `{ page?, collegeId?, userId?, rating?, search?, ... }` | Public |
| `POST` | `/api/reviews/get` | `{ id }` | Public |
| `POST` | `/api/reviews/update` | `{ id, rating?, comment? }` | Owner or Admin |
| `POST` | `/api/reviews/delete` | `{ id }` | Owner or Admin |
| `POST` | `/api/users/list` | `{ page?, limit?, search?, role? }` | Admin |
| `POST` | `/api/users/get` | `{ id }` | Admin |
| `POST` | `/api/users/update-role` | `{ id, role }` | Admin |

Successful reads and updates return `200`. Creates return `201`. Deletes return `204` with an empty body.

Error codes: `400` validation, `401` unauthenticated, `403` forbidden, `404` missing, `409` conflict, `429` auth rate limit, `500` unexpected error.

Response shape:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

Errors return `success: false`, a safe message, and optional `details` for validation failures.

## Swagger and Postman usage

- Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- Raw OpenAPI: [http://localhost:3000/openapi.json](http://localhost:3000/openapi.json)

Postman files:

- `postman/College-Review-System.postman_collection.json`
- `postman/College-Review-System.postman_environment.json`

Import both, then run **Login admin**, **Login teacher**, and **Login student** so the environment stores JWTs. Create a college before creating reviews so `collegeId` is populated.

## Role-based permissions

| Action | Admin | Teacher | Student |
| --- | --- | --- | --- |
| Register publicly as this role | no | yes | yes |
| View colleges and reviews | yes | yes | yes |
| Create / update / delete colleges | yes | no | no |
| Create a review | yes | yes | yes |
| Update / delete own review | yes | yes | yes |
| Update / delete another user's review | yes | no | no |
| List users and change roles | yes | no | no |

Ownership is enforced on the server from the verified JWT. The API ignores `userId` in review bodies.

An admin cannot demote their own account through `PATCH /api/users/:id/role`.

## Database design and aggregation

**User**

- Unique normalized email
- Password stored only as a bcrypt hash and excluded from queries by default
- Role: `admin`, `teacher`, or `student`

**College uniqueness policy**

A college is unique by trimmed, lowercased `name` + `location`. The same institution name in a different city is allowed.

**Review uniqueness policy**

One review per user per college. Enforced in the service layer and with a unique compound index.

**Indexes**

- User: unique email, role
- College: unique `(nameNormalized, locationNormalized)`, name, location, createdAt
- Review: unique `(collegeId, userId)`, `(collegeId, createdAt)`, `(userId, createdAt)`, rating, createdAt

**Average ratings**

College list and detail responses use a `$lookup` + `$group` pipeline on the `reviews` collection. The API does not accept client-supplied averages. Colleges with no reviews return `averageRating: 0` and `reviewCount: 0`. Displayed averages are rounded to two decimal places.

List endpoints paginate in the same aggregation (`$facet`) to avoid N+1 queries.

**College deletion**

Deleting a college deletes its reviews first, then the college document. That is a logical cascade, not a replica-set transaction.

## Security decisions

- Helmet security headers
- Configurable CORS
- Rate limiting on `/api/auth/register` and `/api/auth/login`
- Strong password rule: at least 8 characters, one letter, and one number
- JWT signature and expiry checks
- Joi validation with unknown-field stripping to block mass assignment
- `express-mongo-sanitize` on request bodies, params, and query strings
- Search values are regex-escaped
- Passwords, hashes, and JWT secrets are never returned
- Production error responses do not include stack traces or database internals
- No credentials are hardcoded; `.env.example` contains placeholders only

The process does not log passwords or JWTs.

## Known limitations and production-readiness

This API is suitable for local evaluation. A production deployment still needs:

- HTTPS termination and a hardened reverse proxy
- Secret management instead of a dotenv file on disk
- MongoDB replica set, backups, and restore testing
- Replica-set transactions if college/review deletes must be atomic
- Centralized logging, metrics, and alerting
- Refresh tokens or a revocation list if logout and session invalidation are required
- Email verification and password-reset flows
- Tighter Content-Security-Policy than the Swagger-friendly defaults used here
- Horizontal scaling, process management, and a deployment pipeline
- Load testing and a production rate-limit policy beyond authentication routes

Do not treat a successful local run as evidence that the service is production-ready.
