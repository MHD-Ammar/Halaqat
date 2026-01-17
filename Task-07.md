Act as a Senior Backend Architect. We are implementing the Circles (Halaqat) Module for the system. Current State:

UsersModule is ready. We have users with roles (ADMIN, TEACHER).

Database is connected.

Your Goal: Create the Circle entity and the relationships between Circles and Teachers.

Please follow these instructions strictly.

1. The Circle Entity
   Create apps/api/src/circles/entities/circle.entity.ts.

Fields:

name: string (e.g., "Abu Bakr As-Siddiq Circle").

description: text (optional).

location: string (optional, e.g., "Main Hall, Corner 2").

gender: Enum (MALE, FEMALE) - Import from shared types.

Relationships:

Teacher: A Circle belongs to One User (Teacher).

Use @ManyToOne(() => User) decorator.

Add a teacherId column explicitly for easy querying.

Constraint: A Teacher can have multiple circles (though usually one), so on the User side, it is @OneToMany.

2. DTOs
   CreateCircleDto: name (required), description, gender, teacherId (UUID, required - the Admin assigns the teacher upon creation).

UpdateCircleDto: Partial of Create.

3. Circles Service (Business Logic)
   create(dto): Create a circle and link it to the teacher. Verify that the teacherId belongs to a user with role TEACHER (optional but good practice).

findAll(): Return all circles (with teacher info loaded via relations: ['teacher']).

findOne(id): Return details.

findMyCircles(teacherId): Crucial. Return only circles where teacherId matches the logged-in user.

4. Circles Controller
   Admin Endpoints:

POST /circles: Create a circle.

GET /circles: List all (for Dashboard overview).

PATCH /circles/:id: Edit details (e.g., change teacher).

Teacher Endpoints:

GET /circles/my-list:

Use @UseGuards(JwtAuthGuard).

Returns the circles assigned to the current user.

This is the endpoint the Mobile App will call on the Home Screen.

5. Updates to User Entity
   Don't forget to update apps/api/src/users/entities/user.entity.ts to add the inverse relationship:

@OneToMany(() => Circle, (circle) => circle.teacher)

circles: Circle[]

Acceptance Criteria (Checklist)
[ ] I can create a Circle and assign it to an existing Teacher ID.

[ ] The API response for a Circle includes the full teacher object (without password).

[ ] A Teacher calling GET /circles/my-list sees ONLY their assigned circles.

[ ] An Admin calling GET /circles sees ALL circles.

[ ] Soft Delete works (deleting a circle doesn't delete the teacher).

Output: Provide the code for: Circle entity, CreateCircleDto, CirclesService, and CirclesController. Also show the snippet to add to the User entity.
