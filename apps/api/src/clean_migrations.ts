import datasource from "./database.datasource";
async function run() {
  await datasource.initialize();
  await datasource.query(`DELETE FROM "migrations" WHERE "name" LIKE '%AddGamification%' OR "name" LIKE '%AddAchievements%'`);
  await datasource.destroy();
  console.log("Deleted old migration records");
}
run();
