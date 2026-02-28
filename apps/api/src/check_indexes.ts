import datasource from "./database.datasource";
async function run() {
  await datasource.initialize();
  const res = await datasource.query(`
    select indexname from pg_indexes where indexname in ('IDX_3eb73e616bc8f2c504bf39e3fa', 'IDX_4dad026e9ef580042d5f90cf3e', 'IDX_fe4c14007479298a63556a3223', 'IDX_bf10a9f4a10c15f80450e9d01d', 'IDX_e2f92b2440abc633bd402fdbd6');
  `);
  console.log("Indexes:", res);
  await datasource.destroy();
}
run();
