// src/lib/upsertToNocoDB.js
import fetch from 'node-fetch';

const API_TOKEN  = process.env.NOCO_API_TOKEN;
const PROJECT_ID = 'mvpsen32zk0r0s6';   // Bad Movie Master project
const TABLE_ID   = 'm1mabuzifrwzg1h';   // Bad Movie Table
const BASE_URL   = `https://portal.dasco.services/api/v1/db/data/v1/${PROJECT_ID}/${TABLE_ID}`;

export default async function upsertToNocoDB(payload) {
  try {
    // 1) Look for an existing record matching experiment & title
    const queryUrl = `${BASE_URL}` +
      `?where=(experiment,eq,${payload.experiment})~and` +
      `(title,eq,${encodeURIComponent(payload.title)})`;
    const headers = {
      'Content-Type': 'application/json',
      'xc-token': API_TOKEN,
    };

    const checkRes = await fetch(queryUrl, { headers });
    const checkData = await checkRes.json();

    if (checkData?.list?.length > 0) {
      // 2) Update if found
      const recordId = checkData.list[0].Id;
      const updateRes = await fetch(`${BASE_URL}/${recordId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      if (!updateRes.ok) throw new Error(`Update failed: ${await updateRes.text()}`);
      console.log(`📝 Updated NocoDB: Experiment #${payload.experiment} — ${payload.title}`);
    } else {
      // 3) Insert new if not found
      const insertRes = await fetch(BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const insertData = await insertRes.json();
      if (!insertRes.ok) throw new Error(`Insert failed: ${insertData.message || insertRes.status}`);
      console.log(`✅ Inserted into NocoDB: Experiment #${payload.experiment} — ${payload.title}`);
    }
  } catch (err) {
    console.error(`❌ Error in upsertToNocoDB: ${err.message}`);
  }
}
