Act as a Senior Backend Developer. We are implementing the Daily Session & Attendance Module. Current State:

Circles and Students are ready.

We decided that the Surah table is strictly for Quran.

Now we need to track when the circle meets and who attended.

Your Goal: Implement the Session and Attendance entities with a "Smart Initialization" logic to save the teacher time.

Please follow these instructions strictly.

1. Entities
   Enums: Create AttendanceStatus (PRESENT, ABSENT, LATE, EXCUSED).

Entity 1: Session (apps/api/src/sessions/entities/session.entity.ts)

id: UUID.

date: Date (Only the date part matters, or timestamp).

circleId: Relation to Circle.

notes: Text (General notes for the day).

status: Enum (OPEN, CLOSED) - Default OPEN.

Entity 2: Attendance (apps/api/src/sessions/entities/attendance.entity.ts)

id: UUID.

sessionId: Relation to Session.

studentId: Relation to Student.

status: AttendanceStatus (Default: PRESENT or NULL/PENDING depending on preference. Let's set default to PRESENT to speed up the process, so teacher only marks absentees).

2. DTOs
   UpdateAttendanceDto: studentId, status.

BulkAttendanceDto: Array of objects containing { studentId, status }.

3. Sessions Service (The "Smart" Logic)
   We need a method called findOrCreateTodaySession(circleId):

Check: Does a session exist for this circleId and today's date?

If YES: Return it with its Attendance records loaded.

If NO:

Create a new Session for today.

Auto-Populate: Fetch ALL active students in this Circle.

Create an Attendance record for each student linked to this new session.

Return the new session with the list.

Why? This ensures the teacher opens the app and sees the list immediately. They don't have to "Add Student" to the attendance list manually.

4. Sessions Controller
   GET /sessions/today?circleId=...:

Calls findOrCreateTodaySession.

This is the main endpoint for the Mobile "Attendance" screen.

PATCH /sessions/:id/attendance:

Accepts BulkAttendanceDto.

Updates the status for the students.

GET /sessions/history?circleId=...:

Returns previous sessions (for reports).

Acceptance Criteria (Checklist)
[ ] Session and Attendance tables are created.

[ ] Calling GET /sessions/today for the first time today creates a NEW session and automatically generates attendance records for all students in that circle.

[ ] Calling GET /sessions/today again returns the existing session without duplicating data.

[ ] I can bulk update attendance (e.g., mark 3 students as ABSENT in one request).

Output: Provide the code for: Session & Attendance entities, the SessionsService (focus on the findOrCreateTodaySession logic), and the SessionsController.
