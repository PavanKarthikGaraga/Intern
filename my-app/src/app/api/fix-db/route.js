import { NextResponse } from 'next/server';
import { defaultPool, legacyPool } from '@/lib/db';

export async function GET() {
  const results = [];
  
  const columnsToAdd = [
    { name: 'season', type: "VARCHAR(10) DEFAULT '2026'" },
    { name: 'fieldOfInterest', type: 'VARCHAR(255)' },
    { name: 'careerChoice', type: 'VARCHAR(255)' },
    { name: 'batch', type: 'VARCHAR(50)' },
    { name: 'accommodation', type: 'VARCHAR(50)' },
    { name: 'transportation', type: 'VARCHAR(50)' }
  ];

  async function addColumnsToPool(pool, poolName) {
    for (const col of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE registrations ADD COLUMN \`${col.name}\` ${col.type}`);
        results.push(`Added ${col.name} to ${poolName}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          results.push(`${col.name} already exists in ${poolName}`);
        } else {
          results.push(`Error adding ${col.name} to ${poolName}: ` + e.message);
        }
      }
    }
  }

  try {
    await addColumnsToPool(defaultPool, 'Social_2026');
    await addColumnsToPool(legacyPool, 'Social (legacy)');
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
