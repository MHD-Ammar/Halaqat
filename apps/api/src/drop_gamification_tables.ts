import datasource from "./database.datasource";
async function run() {
  await datasource.initialize();
  await datasource.query(`DROP TABLE IF EXISTS "student_achievement" CASCADE`);
  await datasource.query(`DROP TABLE IF EXISTS "achievement" CASCADE`);
  await datasource.query(`DROP TYPE IF EXISTS "public"."achievement_criteria_type_enum" CASCADE`);
  await datasource.query(`DROP TYPE IF EXISTS "public"."achievement_criteria_category_enum" CASCADE`);
  await datasource.destroy();
  console.log("Dropped gamification tables and enums");
}
run();
