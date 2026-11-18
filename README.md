# Field Notes

**Wordle meets Spotify: hear a music clip, guess the country it came from, build a collection.**

**Play it: [d2wjy0nkocod4t.cloudfront.net](https://d2wjy0nkocod4t.cloudfront.net/)**

No signup needed. There is a guest option on the landing page if you just want to see it work.

<!-- Worth adding a screenshot or a short GIF of a round here. It is the single highest-value
     addition to this file: a reviewer decides whether to keep reading in about three seconds. -->

---

## How it works

Each round plays a clip from a track. You guess the country of origin on a world map, and the game
scores you on how close you were. Guess well and the country joins your collection. Streaks and
scores feed a leaderboard.

The scoring is the part that took the most thought, and it is covered below.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React, TypeScript, Vite |
| API | NestJS, TypeScript |
| Database | PostgreSQL via Prisma |
| Auth | OAuth 2.0 Authorization Code with PKCE (Spotify), hand-rolled |
| Infrastructure | AWS, defined in Terraform |
| Containers | Docker, multi-stage builds |

## Architecture

Everything in `infra/terraform` is real and deployed. Nothing here is a diagram of an intention.

```
CloudFront  ──►  S3                    static React build, HTTPS, SPA routing via a
                                       CloudFront Function (spa-routing.js)

CloudFront  ──►  ALB  ──►  ECS         NestJS API running as a container pulled from ECR
                            │
                            ▼
                           RDS         PostgreSQL, single-AZ
```

Secrets live in **SSM Parameter Store** rather than in the task definition. Networking, subnets and
security groups are in `vpc.tf` and `security_groups.tf`.

Two deliberate cost decisions, both of which I would reverse for anything carrying real traffic:

- **No NAT Gateway.** It is the single most expensive line item in a small AWS estate and this
  project does not need outbound traffic from private subnets badly enough to justify it.
- **Single-AZ RDS, no read replica.** Fine for a side project, not fine for production.

## Three decisions worth looking at

### 1. The OAuth flow is hand-rolled

`apps/api/src/auth/pkce.util.ts`

I wrote the Authorization Code flow with PKCE myself instead of importing Passport. That cost
considerably more time than the library would have, and it was the point. I wanted to understand
what the code verifier and challenge actually defend against, why `state` exists separately from
PKCE, and what breaks when redirect handling is wrong.

The practical result is that this is the part of the codebase I can explain in the most detail,
including its failure modes.

### 2. Scoring switched from centroid distance to polygon-boundary distance

The obvious way to score a guess is distance between the centroid of the guessed country and the
centroid of the answer. It is one line of maths and it is fast.

It also feels wrong to play. Guess Portugal when the answer is Spain and you are standing on the
border, but the centroids are hundreds of kilometres apart, so the game tells you that you were
nowhere close. The player knows better than the scoring function does.

I replaced it with true minimum distance between country polygon boundaries using **Turf.js**. More
computation, more fiddly geometry handling, and correct, because it matches what a player actually
experiences. This was a product decision that happened to be implemented in code.

### 3. The leaderboard uses real SQL

`apps/api/src/leaderboard`

Rankings use window functions (`RANK() OVER (PARTITION BY ...)`) rather than sorting in application
code. Streaks use a gaps-and-islands pattern to find consecutive runs of correct days. Both belong
in the database, and putting them there keeps the API thin.

## Repository layout

```
apps/
  api/            NestJS API
    src/
      auth/       OAuth 2.0 + PKCE, session guard
      rounds/     round generation and guess scoring
      countries/  country data and geometry
      collection/ the collection a player builds up
      leaderboard/ ranking and streak queries
      prisma/     database client and schema access
  web/            React frontend
infra/
  terraform/      AWS: VPC, ALB, ECS, ECR, RDS, S3, CloudFront, SSM
docker-compose.yml
.env.example
```

The API exposes OpenAPI/Swagger docs when running.

## Running it locally

Requires Node and Docker.

```bash
cp .env.example .env            # Postgres connection defaults are in here
docker compose up -d            # starts PostgreSQL
npm install
npm run dev:api                 # NestJS API
npm run dev:web                 # React frontend
```

You will also need Spotify application credentials for the auth flow. The guest path works without
them.

## Known limitations

Stated here so nobody has to find them by reading the code:

- **No CI/CD.** Deploys are manual and require local AWS credentials.
- **No remote state locking** on the Terraform. Fine for one person, unsafe for a team.
- **Test coverage is thin** beyond scaffolding.
- **Single-AZ RDS**, no read replica, as described above.

## Why it exists

I built this solo while finishing an MS in Computer Science, to work through a full production
deployment end to end rather than in pieces: the auth flow, the container build, the infrastructure,
the database queries and the deploy. I used Cursor and Claude to move quickly, and I can defend every
architectural decision in here, including the ones I would now make differently.
