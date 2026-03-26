import datasource from "./database.datasource";
async function run() {
  await datasource.initialize();
  await datasource.query(`INSERT INTO "migrations" ("timestamp", "name") VALUES (1770500000000, 'AddGamificationColumnsToPointRule1770500000000') ON CONFLICT DO NOTHING;`);
  await datasource.destroy();
  console.log("Restored AddGamificationColumnsToPointRule migration record");
}
run();
