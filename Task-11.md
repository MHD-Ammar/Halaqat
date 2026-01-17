Act as a Senior Backend Architect. We are implementing the Dynamic Points & Gamification Engine. User Vision: We need a flexible system where point values are NOT hardcoded. An Admin should be able to change how many points a "Page" is worth later. Also, we need to prevent point inflation by capping how many "Manual Points" a teacher can give per session.

Your Goal: Implement the Recitation entity, the PointRule configuration system, and the PointTransaction ledger.

Please follow these instructions strictly.

1. Entities
   Enum RecitationType: NEW_LESSON (Hifz), REVIEW (Mraja'a).

Enum RecitationQuality: EXCELLENT, VERY_GOOD, GOOD, ACCEPTABLE, POOR.

Entity 1: PointRule (apps/api/src/points/entities/point-rule.entity.ts)

Purpose: Stores the configuration for points so Admins can edit them later.

key: String (Unique, e.g., RECITATION_EXCELLENT, ATTENDANCE_ON_TIME).

description: String (e.g., "Points for excellent recitation").

points: Int (Value, e.g., 5).

isActive: Boolean (Default true).

Entity 2: Recitation (apps/api/src/progress/entities/recitation.entity.ts)

id: UUID.

studentId, sessionId (Relations).

surahId, startVerse, endVerse.

type: RecitationType.

quality: RecitationQuality.

mistakesCount: Int.

Entity 3: PointTransaction (The Ledger)

studentId: Relation.

amount: Int.

reason: String.

sourceType: Enum (RECITATION, ATTENDANCE, MANUAL_REWARD, MANUAL_PENALTY).

sessionId: Relation (Crucial for budget calculation).

createdAt: Timestamp.

2. Database Seeding (Default Rules)
   Create a seeding script/logic to insert default rules if they don't exist:

RECITATION_EXCELLENT: 5 points

RECITATION_VERY_GOOD: 3 points

RECITATION_GOOD: 1 point

ATTENDANCE_PRESENT: 2 points

3. Points Service (Smart Logic)
   calculateAndAwardPoints(studentId, ruleKey, sessionId):

Look up the PointRule by key.

If active, create a PointTransaction.

Update Student.totalPoints.

The Teacher Budget Logic (addManualPoints):

Accepts: studentId, amount, reason, sessionId, teacherId.

Validation: Calculate the SUM of all manual points given by this teacher in THIS session (sessionId).

Constraint: If (currentSum + amount) > 20 (Configurable limit), throw a 400 BadRequest error: "You have exceeded your manual points budget for this session."

4. Progress Service (Integration)
   recordRecitation(dto):

Save Recitation.

Determine the Rule Key based on quality (e.g., if quality is EXCELLENT -> use RECITATION_EXCELLENT).

Call PointsService.calculateAndAwardPoints.

5. Controllers
   RecitationController: Record recitation (Auto-triggers points).

PointsController:

POST /points/manual: Give manual points (Protected by the budget check).

GET /points/history/:studentId: Student's history.

GET /points/rules: (Admin only) List all rules.

PATCH /points/rules/:key: (Admin only) Update point values (e.g., change 5 to 10).

Acceptance Criteria (Checklist)
[ ] The PointRule table exists and is seeded with default values.

[ ] Recording an "Excellent" recitation fetches the value "5" from the DB (not hardcoded) and adds points.

[ ] Budget Test: If I try to give 30 manual points in one session, the system rejects it.

[ ] I can update the RECITATION_EXCELLENT rule via API to be 10 points, and subsequent recitations use the new value.

Output: Provide: PointRule entity, PointTransaction entity, PointsService (including the Budget Logic), and RecitationController.
