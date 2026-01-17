Act as a Senior Backend Developer. We are building the User Management Module for the "Halaqat" system. Current State:

Auth System is ready (JWT, RolesGuard).

Database is ready (User Entity).

UsersModule exists but only has the bare minimum for Auth.

Your Goal: Implement the Admin-Only User Management API (Full CRUD) with Pagination and Serialization (security).

Please follow these instructions strictly.

1. Serialization (Security First)
   Requirement: We must NEVER return the password field in API responses.

Implementation:

In apps/api/src/users/entities/user.entity.ts, ensure the password column has @Exclude({ toPlainOnly: true }) (using class-transformer).

Apply UseInterceptors(ClassSerializerInterceptor) globally in main.ts or on the UsersController.

2. DTOs & Validation
   Create the following DTOs in apps/api/src/users/dto:

CreateUserDto: email (email), password (min 6), fullName (string), role (enum: UserRole), mosqueId (optional UUID).

UpdateUserDto: PartialType(CreateUserDto).

UserQueryDto (for Pagination): page (int, min 1), limit (int, max 50), search (string, optional), role (enum, optional).

3. Users Service (Logic)
   Update UsersService to include:

findAll(query: UserQueryDto):

Should return { data: User[], meta: { total, page, lastPage } }.

Implement Filtering: If search is present, look in fullName OR email. If role is present, filter by it.

Implement Pagination: Use skip and take based on page/limit.

create(createUserDto): (Already exists for Auth, but ensure it handles Admin creation flow).

update(id, updateUserDto): Update fields. Crucial: If password is being updated, hash it! If not, leave it.

remove(id): Soft Delete the user.

Constraint: Prevent deleting the user if id === currentUser.id (Admin cannot delete themselves to avoid lockout).

4. Users Controller (Endpoints)
   Create/Update UsersController with route prefix users:

Security: Apply @UseGuards(JwtAuthGuard, RolesGuard) and @Roles(UserRole.ADMIN) to the entire controller. (Only Admins can manage users).

Endpoints:

GET /: returns paginated list.

GET /:id: returns single user.

POST /: creates a new teacher/supervisor.

PATCH /:id: updates user.

DELETE /:id: soft deletes user.

Acceptance Criteria (Checklist)
[ ] GET /users does NOT return passwords in the JSON response.

[ ] Pagination works (e.g., ?page=2&limit=5 returns the correct subset).

[ ] Searching by name works (e.g., ?search=Ahmad).

[ ] Only users with role ADMIN can access these endpoints. A TEACHER gets 403 Forbidden.

[ ] Admin cannot delete their own account via the API.

[ ] Updating a user's password automatically hashes the new password.

Output: Provide the code for: UserQueryDto, updated UsersService, and UsersController.
