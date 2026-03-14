const { Pool } = require('pg');

async function run() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.hfnkasohnannqqxzpqbc:nammavansh9142@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query('SELECT complaint_id, category, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat FROM complaints LIMIT 1');
    if (res.rows.length === 0) {
      console.log("No complaints");
      return;
    }
    const c = res.rows[0];
    console.log("Found complaint:", c.complaint_id);

    // Manual insert to test
    const ins = await pool.query(
      'INSERT INTO clusters (issue_type, location, complaint_count) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 1) RETURNING cluster_id',
      [c.category, c.lng, c.lat]
    );
    console.log("Inserted cluster:", ins.rows[0].cluster_id);

    const count = await pool.query('SELECT COUNT(*) FROM clusters');
    console.log("Total clusters now:", count.rows[0].count);

  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await pool.end();
  }
}

run();
