import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { COLLECTIONS, CATEGORY_SEEDS, ensureDefaultData } from '@/lib/db';

export async function GET() {
  try {
    await ensureDefaultData();
    const db = await getDatabase();

    const countsAgg = await db
      .collection(COLLECTIONS.SUBMISSIONS)
      .aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ])
      .toArray();

    const counts: Record<string, number> = {};
    for (const cat of CATEGORY_SEEDS) {
      counts[cat.id] = 0;
    }
    for (const item of countsAgg) {
      if (item._id) {
        counts[item._id as string] = item.count;
      }
    }

    return NextResponse.json({
      categories: CATEGORY_SEEDS,
      counts,
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
