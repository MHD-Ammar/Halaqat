Act as a Senior Backend Security Engineer. We are building the Authentication module for the "Halaqat" NestJS application. Current State: We have the User entity and Database connection ready. Your Goal: Implement a secure, stateless JWT Authentication system with Role-Based Access Control (RBAC).

Please follow these instructions strictly to ensure security best practices.

1. Dependencies & Configuration
   Install: @nestjs/passport, passport, passport-jwt, @nestjs/jwt, and bcrypt.

Add JWT_SECRET and JWT_EXPIRATION (e.g., '1d') to the .env file and env.validation.ts schema (fail if missing).

2. Auth Module & Service Logic
   Create an AuthModule.

Password Hashing:

In UsersService (create if missing), implement a create method that hashes the password using bcrypt before saving to the database.

Never save plain-text passwords.

Login Logic (AuthService):

validateUser(email, pass): Check if user exists and use bcrypt.compare to verify password.

login(user): Generate a JWT containing the user's sub (id), email, and role.

3. Guards & Strategies (The Security Layer)
   JWT Strategy: Implement JwtStrategy extending PassportStrategy(Strategy).

It should extract the token from the Authorization: Bearer header.

It should validate the token signature using the secret.

Guards:

JwtAuthGuard: A global-ready guard to protect endpoints.

RolesGuard: A guard that checks if the user has the required permission level.

Custom Decorators (Clean Code):

@Roles(...roles: UserRole[]): A metadata decorator to assign required roles to a controller/route. Import UserRole from @halaqat/types.

@CurrentUser(): A parameter decorator to extract the user object cleanly from the Request (so we don't write req.user manually).

4. Controller Endpoints
   Create AuthController with the following endpoints:

POST /auth/register: Accepts email, password, fullName. Creates a new user.

POST /auth/login: Accepts email, password. Returns { accessToken: string }.

GET /auth/profile: A protected route (Use JwtAuthGuard) that returns the current user's profile.

Technical Constraints
Type Safety: Use DTOs (RegisterDto, LoginDto) with class-validator decorators (IsEmail, MinLength, etc.).

Error Handling: Return 401 Unauthorized for bad credentials and 409 Conflict if the email already exists during registration.

Role Logic: The RolesGuard must access the user attached to the request by the JwtAuthGuard and compare their role against the @Roles decorator.

Acceptance Criteria (Checklist)
[ ] I can register a new user via Postman; the password appears hashed in the database (e.g., starts with $2b$).

[ ] I can login and receive a valid JWT string.

[ ] Accessing /auth/profile without a token returns 401 Unauthorized.

[ ] Accessing /auth/profile with a token returns the user data.

[ ] (Self-Test Code): Create a dummy endpoint /admin-only decorated with @Roles(UserRole.ADMIN). A user with role TEACHER should receive 403 Forbidden.

Output: Provide the code for: AuthService, JwtStrategy, RolesGuard, CurrentUser decorator, and the AuthController. Also, show how to register these in app.module.ts.
