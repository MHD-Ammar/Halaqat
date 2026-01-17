Act as a Senior Backend Architect. We are continuing the development of the "Halaqat" Monorepo. Current State: We have a TurboRepo setup with apps/api (NestJS) and apps/web (Next.js) and a shared @halaqat/types package.

Your Goal: Setup the Database Infrastructure (PostgreSQL), Object-Relational Mapping (TypeORM), and Environment Configuration.

Please follow these instructions strictly to ensure scalability and type safety.

1. Infrastructure (Docker)
   Create a docker-compose.yml file at the root of the monorepo after installing docker.

Service: postgres (Use image: postgres:16-alpine).

Configuration:

Map port 5432 to 5432.

Use a named volume for data persistence (so we don't lose data on restart).

Load environment variables from a .env file.

Add a visual dashboard container (like pgadmin or suggest a VS Code extension recommendation) to easily view data.

2. Backend Configuration (apps/api)
   Environment Variables:

Install @nestjs/config and joi (for validation).

Create a src/config/env.validation.ts file. Constraint: The app must fail to start if required DB variables (HOST, PORT, USER, PASS, DB_NAME) are missing.

TypeORM Setup:

Install @nestjs/typeorm, typeorm, and pg.

Configure TypeOrmModule.forRootAsync in app.module.ts. Use the config service to inject credentials.

Naming Strategy: Configure TypeORM to use Snake Case naming strategy for database columns (e.g., fullName in code becomes full_name in DB).

3. Base Architecture & First Entity
   Abstract Base Entity: Create a common/entities/base.entity.ts inside apps/api.

It must include: id (UUID), createdAt, updatedAt, and deletedAt (Soft Delete). All future entities must extend this.

User Entity: Create the User entity (src/users/entities/user.entity.ts).

Fields: email (unique), password (string), fullName.

Integration: Import the UserRole enum from our shared package @halaqat/types and use it for a role column.

Scalability Prep (Multi-tenancy): Add a mosqueId column (UUID, nullable for now) to prepare for future SaaS capabilities.

4. Migration System (Crucial)
   We will NOT use synchronize: true in production logic.

Set up the TypeORM CLI datasource configuration file (e.g., typeorm-cli.config.ts).

Add scripts to apps/api/package.json to:

Generate a migration (migration:generate).

Run migrations (migration:run).

Revert migrations (migration:revert).

Acceptance Criteria (Checklist)
[ ] docker-compose up starts Postgres successfully without errors.

[ ] NestJS connects to the DB on startup. If I break the password in .env, NestJS throws a clear validation error and stops.

[ ] The User entity correctly imports UserRole from the shared workspace package.

[ ] You provide the shell command to generate the initial migration that creates the User table.

[ ] The database table user is created with columns in snake_case (e.g., created_at, mosque_id).

Output: Provide the docker-compose.yml, the detailed TypeORM configuration code, the Base/User entities, and the specific commands to run the first migration.
