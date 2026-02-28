import datasource from "./database.datasource";
async function run() {
  await datasource.initialize();
  const res = await datasource.query(`
    select relname, relkind from pg_class where relname like '%achievement%';
  `);
  console.log("Relations:", res);
  await datasource.destroy();
}
run();
