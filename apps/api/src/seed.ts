/**
 * Database Seeder
 *
 * Comprehensive seed script that creates test data for development.
 * Includes: Mosque, Users (all roles), Circles, Students, Sessions, Exams.
 *
 * Usage: pnpm run seed
 *
 * Note: Surahs and PointRules are seeded automatically on app bootstrap.
 */

import { Gender, UserRole, SessionStatus, ExamStatus } from "@halaqat/types";
import { NestFactory } from "@nestjs/core";
import * as bcrypt from "bcrypt";
import { DataSource } from "typeorm";

import { AppModule } from "./app.module";

// Test data constants
const TEST_PASSWORD = "password123";
const MOSQUE_ID = "00000000-0000-4000-a000-000000000001";

async function seed() {
  console.log("🌱 Starting database seeding...\n");

  // Create NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Hash password once for all users
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // ========================================
    // 1. Create Mosque
    // ========================================
    console.log("📍 Creating mosque...");
    await dataSource.query(
      `
      INSERT INTO "mosque" (id, name, code, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `,
      [MOSQUE_ID, "مسجد النور - Al-Noor Mosque", "NOOR24"],
    );
    console.log("   ✓ Mosque created\n");

    // ========================================
    // 2. Create Users (one for each role)
    // ========================================
    console.log("👥 Creating users...");

    const users = [
      {
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        email: "admin@halaqat.test",
        fullName: "أحمد المدير - Admin Ahmed",
        phoneNumber: "+1111111111",
        role: UserRole.ADMIN,
      },
      {
        id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
        email: "teacher@halaqat.test",
        fullName: "محمد المعلم - Teacher Mohammed",
        phoneNumber: "+2222222222",
        role: UserRole.TEACHER,
      },
      {
        id: "cccccccc-cccc-4ccc-cccc-cccccccccccc",
        email: "teacher2@halaqat.test",
        fullName: "علي المعلم - Teacher Ali",
        phoneNumber: "+3333333333",
        role: UserRole.TEACHER,
      },
      {
        id: "dddddddd-dddd-4ddd-dddd-dddddddddddd",
        email: "examiner@halaqat.test",
        fullName: "خالد الممتحن - Examiner Khaled",
        phoneNumber: "+4444444444",
        role: UserRole.EXAMINER,
      },
      {
        id: "eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee",
        email: "supervisor@halaqat.test",
        fullName: "عمر المشرف - Supervisor Omar",
        phoneNumber: "+5555555555",
        role: UserRole.SUPERVISOR,
      },
    ];

    for (const user of users) {
      await dataSource.query(
        `
        INSERT INTO "user" (id, email, password, full_name, phone_number, role, mosque_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          mosque_id = EXCLUDED.mosque_id
      `,
        [
          user.id,
          user.email,
          hashedPassword,
          user.fullName,
          user.phoneNumber,
          user.role,
          MOSQUE_ID,
        ],
      );
      console.log(`   ✓ ${user.role}: ${user.email}`);
    }
    console.log("");

    // ========================================
    // 3. Create Circles
    // ========================================
    console.log("📚 Creating circles...");

    const circles = [
      {
        id: "11111111-2222-4333-a444-555555555555",
        name: "حلقة أبو بكر الصديق",
        description: "حلقة للمبتدئين",
        location: "القاعة الرئيسية",
        gender: Gender.MALE,
        teacherId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb", // Teacher Mohammed
      },
      {
        id: "22222222-3333-4444-a555-666666666666",
        name: "حلقة عمر بن الخطاب",
        description: "حلقة للمتقدمين",
        location: "الجناح الشرقي",
        gender: Gender.MALE,
        teacherId: "cccccccc-cccc-4ccc-cccc-cccccccccccc", // Teacher Ali
      },
      {
        id: "33333333-4444-4555-a666-777777777777",
        name: "حلقة خديجة بنت خويلد",
        description: "حلقة البنات",
        location: "قسم النساء",
        gender: Gender.FEMALE,
        teacherId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb", // Teacher Mohammed
      },
    ];

    for (const circle of circles) {
      await dataSource.query(
        `
        INSERT INTO "circle" (id, name, description, location, gender, teacher_id, mosque_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          teacher_id = EXCLUDED.teacher_id,
          mosque_id = EXCLUDED.mosque_id
      `,
        [
          circle.id,
          circle.name,
          circle.description,
          circle.location,
          circle.gender,
          circle.teacherId,
          MOSQUE_ID,
        ],
      );
      console.log(`   ✓ ${circle.name}`);
    }
    console.log("");

    // ========================================
    // 4. Create Students
    // ========================================
    console.log("🎓 Creating students...");

    const students = [
      // Circle 1 students
      {
        id: "f1111111-1111-4111-a111-111111111111",
        name: "يوسف أحمد",
        phone: "+1001001001",
        circleId: circles[0]!.id,
        guardianName: "أحمد محمد",
        guardianPhone: "+1001001000",
      },
      {
        id: "f2222222-2222-4222-a222-222222222222",
        name: "عبدالله علي",
        phone: "+1002002002",
        circleId: circles[0]!.id,
        guardianName: "علي حسن",
        guardianPhone: "+1002002000",
      },
      {
        id: "f3333333-3333-4333-a333-333333333333",
        name: "محمد خالد",
        phone: "+1003003003",
        circleId: circles[0]!.id,
        guardianName: "خالد سعيد",
        guardianPhone: "+1003003000",
      },
      {
        id: "f4444444-4444-4444-a444-444444444444",
        name: "إبراهيم عمر",
        phone: "+1004004004",
        circleId: circles[0]!.id,
        guardianName: "عمر فتحي",
        guardianPhone: "+1004004000",
      },
      {
        id: "f5555555-5555-4555-a555-555555555555",
        name: "أحمد ياسر",
        phone: "+1005005005",
        circleId: circles[0]!.id,
        guardianName: "ياسر محمود",
        guardianPhone: "+1005005000",
      },
      // Circle 2 students
      {
        id: "f6666666-6666-4666-a666-666666666666",
        name: "عمر حسام",
        phone: "+2001001001",
        circleId: circles[1]!.id,
        guardianName: "حسام الدين",
        guardianPhone: "+2001001000",
      },
      {
        id: "f7777777-7777-4777-a777-777777777777",
        name: "زيد كريم",
        phone: "+2002002002",
        circleId: circles[1]!.id,
        guardianName: "كريم أحمد",
        guardianPhone: "+2002002000",
      },
      {
        id: "f8888888-8888-4888-a888-888888888888",
        name: "حمزة سامي",
        phone: "+2003003003",
        circleId: circles[1]!.id,
        guardianName: "سامي علي",
        guardianPhone: "+2003003000",
      },
      // Circle 3 students (female)
      {
        id: "f9999999-9999-4999-a999-999999999999",
        name: "فاطمة محمد",
        phone: "+3001001001",
        circleId: circles[2]!.id,
        guardianName: "محمد علي",
        guardianPhone: "+3001001000",
      },
      {
        id: "fa111111-1111-4111-a111-111111111111",
        name: "مريم أحمد",
        phone: "+3002002002",
        circleId: circles[2]!.id,
        guardianName: "أحمد سعيد",
        guardianPhone: "+3002002000",
      },
      {
        id: "fb222222-2222-4222-a222-222222222222",
        name: "عائشة خالد",
        phone: "+3003003003",
        circleId: circles[2]!.id,
        guardianName: "خالد محمود",
        guardianPhone: "+3003003000",
      },
    ];

    for (const student of students) {
      await dataSource.query(
        `
        INSERT INTO "student" (id, name, phone, circle_id, mosque_id, guardian_name, guardian_phone, total_points, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          circle_id = EXCLUDED.circle_id,
          mosque_id = EXCLUDED.mosque_id
      `,
        [
          student.id,
          student.name,
          student.phone,
          student.circleId,
          MOSQUE_ID,
          student.guardianName,
          student.guardianPhone,
          Math.floor(Math.random() * 100),
        ],
      );
      console.log(`   ✓ ${student.name}`);
    }
    console.log("");

    // ========================================
    // 5. Create Today's Sessions
    // ========================================
    console.log("📅 Creating sessions...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const circle of circles) {
      // Use proper UUID
      const sessionId = crypto.randomUUID();
      await dataSource.query(
        `
        INSERT INTO "session" (id, date, status, circle_id, mosque_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `,
        [sessionId, today, SessionStatus.OPEN, circle.id, MOSQUE_ID],
      );
      console.log(`   ✓ Session for ${circle.name}`);
    }
    console.log("");

    // ========================================
    // 6. Create Sample Exams
    // ========================================
    console.log("📝 Creating sample exams...");

    for (const student of students) {
        // Create 1-3 exams per student
        const examCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 1; i <= examCount; i++) {
            const examId = crypto.randomUUID();
            const juzNumber = Math.floor(Math.random() * 5) + 26; // Juz 26-30
            const passed = Math.random() > 0.3; // 70% pass rate
            
            // Score calculations
            const currentScore = passed ? 85 + Math.floor(Math.random() * 15) : 60 + Math.floor(Math.random() * 15);
            const cumulativeScore = passed ? 80 + Math.floor(Math.random() * 20) : 50 + Math.floor(Math.random() * 20);
            const finalScore = (currentScore + cumulativeScore) / 2;
            
            await dataSource.query(
                `
                INSERT INTO "exam" (
                    id, student_id, examiner_id, date, 
                    juz_number, attempt_number,
                    current_part_score, cumulative_score, final_score,
                    passed, tested_parts,
                    status, mosque_id, created_at, updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
                ON CONFLICT DO NOTHING
            `,
                [
                    examId,
                    student.id,
                    "dddddddd-dddd-4ddd-dddd-dddddddddddd", // Examiner
                    new Date(today.getTime() - i * 86400000), // Previous days
                    juzNumber,
                    1, // attempt
                    currentScore,
                    cumulativeScore,
                    finalScore,
                    passed,
                    [juzNumber, juzNumber > 1 ? juzNumber - 1 : 30], // Tested parts (current + prev)
                    ExamStatus.COMPLETED,
                    MOSQUE_ID,
                ],
            );
            console.log(`   ✓ Exam for ${student.name} - Juz ${juzNumber} (${passed ? 'Passed' : 'Failed'})`);
        }
    }
    console.log("");

    // ========================================
    // Summary
    // ========================================
    console.log("═══════════════════════════════════════════");
    console.log("✅ Database seeding completed successfully!");
    console.log("═══════════════════════════════════════════\n");
    console.log("📋 Test Credentials (password for all: password123):\n");
    console.log("   ADMIN:      admin@halaqat.test");
    console.log("   TEACHER:    teacher@halaqat.test");
    console.log("   TEACHER 2:  teacher2@halaqat.test");
    console.log("   EXAMINER:   examiner@halaqat.test");
    console.log("   SUPERVISOR: supervisor@halaqat.test");
    console.log("\n   Mosque Code: NOOR24\n");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run seeder
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
