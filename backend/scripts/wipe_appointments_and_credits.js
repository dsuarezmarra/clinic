const fetch = globalThis.fetch || require('node-fetch');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
  process.exit(1);
}

const tables = ['appointments', 'credit_packs', 'credit_redemptions'];

(async function wipe() {
  try {
    console.log('Will delete all rows from:', tables.join(', '));
    for (const table of tables) {
      console.log('Deleting', table);
      // PostgREST requires a predicate for DELETE; use id=not.is.null to match all rows when table has an 'id' PK
      try {
        const urlWithFilter = `${SUPABASE_URL}/rest/v1/${table}?id=not.is.null`;
        const res = await fetch(urlWithFilter, {
          method: 'DELETE',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: 'return=minimal'
          }
        });

        if (!res.ok) {
          // If PostgREST rejects because table has no id column or different schema, try chunked delete by selecting ids first
          const text = await res.text().catch(() => '');
          console.warn(`Initial delete for ${table} returned ${res.status}: ${text}`);
          // Try to fetch ids and delete by id in chunks
          const selectUrl = `${SUPABASE_URL}/rest/v1/${table}?select=id`;
          const sel = await fetch(selectUrl, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
          if (!sel.ok) {
            const st = await sel.text().catch(() => '');
            console.error(`Could not fetch ids for ${table}: ${sel.status} ${st}`);
            continue;
          }
          const ids = await sel.json();
          const idList = ids.map(r => r.id).filter(x => x !== undefined && x !== null);
          if (idList.length === 0) {
            console.log(`No rows to delete for ${table}`);
            continue;
          }
          // delete in chunks of 100
          for (let i = 0; i < idList.length; i += 100) {
            const chunk = idList.slice(i, i + 100);
            const cond = chunk.map(v => `id=eq.${v}`).join('&');
            const delUrl = `${SUPABASE_URL}/rest/v1/${table}?${cond}`;
            const dres = await fetch(delUrl, { method: 'DELETE', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
            if (!dres.ok) {
              const t = await dres.text().catch(() => '');
              console.error(`Chunk delete failed for ${table}: ${dres.status} ${t}`);
            }
          }
          console.log(`Deleted ${table} via chunked ids (count ${idList.length})`);
        } else {
          console.log(`Deleted ${table} OK (status ${res.status})`);
        }
      } catch (e) {
        console.error(`Error deleting ${table}:`, e && e.message ? e.message : e);
      }
    }

    // verify counts
    console.log('\nVerifying counts:');
    for (const table of tables.concat(['patients'])) {
      const url = `${SUPABASE_URL}/rest/v1/${table}?select=count`;
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        });
        const text = await res.text();
        console.log(`${table}: ${text}`);
      } catch (e) {
        console.warn('Error getting count for', table, e && e.message ? e.message : e);
      }
    }

    console.log('Done.');
  } catch (e) {
    console.error('Error during wipe:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();
