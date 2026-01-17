
import { DataSource } from "typeorm";
import { User } from "../src/users/entities/user.entity";
import { Circle } from "../src/circles/entities/circle.entity";
import { Student } from "../src/students/entities/student.entity";
import { UserRole } from "../../../packages/types/src/UserRole"; // Adjust path to types
import * as dotenv from "dotenv";
import * as bcrypt from "bcrypt";
import * as path from "path";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

// Load env vars from .env in root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Config
const dataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "halaqat_db",
  entities: [User, Circle, Student],
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
});

async function seed() {
  await dataSource.initialize();
  console.log("Database connected");

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userRepo = queryRunner.manager.getRepository(User);
    const circleRepo = queryRunner.manager.getRepository(Circle);
    const studentRepo = queryRunner.manager.getRepository(Student);

    // 1. Create Teacher
    const email = "teacher@demo.com";
    let teacher = await userRepo.findOne({ where: { email } });

    if (!teacher) {
      console.log("Creating teacher...");
      const hashedPassword = await bcrypt.hash("password123", 10);
      teacher = userRepo.create({
        email,
        password: hashedPassword,
        fullName: "Demo Teacher",
        role: UserRole.TEACHER,
      });
      await userRepo.save(teacher);
    } else {
      console.log("Teacher already exists");
    }

    // 2. Create Circle
    if (teacher) {
        let circle = await circleRepo.findOne({ where: { teacherId: teacher.id } });
        if (!circle) {
          console.log("Creating circle...");
          circle = circleRepo.create({
            name: "Fajr Light Circle",
            teacher,
            teacherId: teacher.id,
          });
          await circleRepo.save(circle);
        } else {
             console.log("Circle already exists");
        }

        // 3. Create Students
        if (circle) {
             const studentParams = [
                 { name: "Ahmed Ali", phone: "0100000001" },
                 { name: "Omar Youssef", phone: "0100000002" },
                 { name: "Khaled Ibn Walid", phone: "0100000003" },
             ];
             
             for (const s of studentParams) {
                 const exists = await studentRepo.findOne({ where: { name: s.name, circleId: circle.id }});
                 if (!exists) {
                     console.log(`Creating student ${s.name}...`);
                     await studentRepo.save(studentRepo.create({
                         ...s,
                         circle,
                         circleId: circle.id
                     }));
                 }
             }
        }
    }

    await queryRunner.commitTransaction();
    console.log("Seeding complete!");

  } catch (err) {
    console.error("Seeding failed:", err);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed();
