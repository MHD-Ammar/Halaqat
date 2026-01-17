Act as a Senior Backend Developer. We are implementing the Students Module for the system. Current State:

CirclesModule is ready.

We have a One-to-Many relationship between User (Teacher) and Circle.

Your Goal: Create the Student entity and the Logic to manage them, enabling Teachers to quickly add students to their circles.

Please follow these instructions strictly.

1. The Student Entity
   Create apps/api/src/students/entities/student.entity.ts.

Fields:

name: string (Required).

phone: string (Optional - Parent's phone).

dob: Date (Optional - Date of Birth).

address: string (Optional).

notes: text (Optional - Medical or behavioral notes).

Relationships:

Circle: A Student belongs to One Circle.

Use @ManyToOne(() => Circle, (circle) => circle.students) logic.

Add circleId column explicitly.

Cascade: If a Circle is deleted, do NOT delete students (Set Null or Restrict), or use Soft Delete (Preferred).

2. DTOs (Focus on Speed)
   CreateStudentDto:

name: (Required).

circleId: (Required - The circle they are joining).

All other fields (phone, dob, address) should be Optional.

Rationale: This allows the teacher to add a student in 5 seconds just by name.

UpdateStudentDto: Partial of Create.

StudentQueryDto: Include pagination and search (by name) and circleId filter.

3. Students Service (Business Logic)
   create(dto): Standard creation.

findAll(query): Return paginated list.

findByCircle(circleId): Optimized method to get all students in a specific circle (sorted alphabetically).

searchByName(term): Use TypeORM ILike for case-insensitive search (useful for checking duplicates).

4. Students Controller
   Endpoints:

POST /students: Create a student.

GET /students: List all (Admin view).

GET /students/by-circle/:circleId: Get students for a specific circle.

PATCH /students/:id: Update details.

DELETE /students/:id: Soft delete.

5. Security & Validation
   Ensure that when a Teacher tries to add a student to a circleId, the backend verifies that this circleId actually belongs to that teacher (Authorization check).

Note: You can implement a helper method in CirclesService to validate ownership: validateCircleOwnership(circleId, teacherId).

Acceptance Criteria (Checklist)
[ ] I can create a student providing ONLY name and circleId.

[ ] GET /students/by-circle/:id returns the list of students for that circle.

[ ] Students are correctly linked to the Circle entity in the DB.

[ ] Searching for a student by partial name works.

Output: Provide the code for: Student entity, CreateStudentDto, StudentsService (including the ownership check logic), and StudentsController.
