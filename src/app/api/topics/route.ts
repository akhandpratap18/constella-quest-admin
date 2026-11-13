import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: objects, error: objErr } = await supabase
      .from('CelestialObjects')
      .select('id, name, category, subtitle, summary, imageUrl')
      .order('name', { ascending: true });

    if (objErr) throw objErr;

    const { data: topics, error: topErr } = await supabase
      .from('Topics')
      .select('id, objectId, title');

    if (topErr) throw topErr;

    // Group by canonical categories
    const categoriesMap: Record<string, any[]> = {
      Planets: [],
      Galaxies: [],
      Constellations: [],
      Phenomena: [],
    };

    (objects || []).forEach((obj) => {
      const rawCat = (obj.category || '').toLowerCase();
      let canonCat = 'Phenomena';
      if (rawCat.includes('planet')) canonCat = 'Planets';
      else if (rawCat.includes('galax')) canonCat = 'Galaxies';
      else if (rawCat.includes('constellat')) canonCat = 'Constellations';
      else if (rawCat.includes('phenomen')) canonCat = 'Phenomena';

      const objTopics = (topics || []).filter((t) => t.objectId === obj.id);

      categoriesMap[canonCat].push({
        id: obj.id,
        name: obj.name,
        category: canonCat,
        subtitle: obj.subtitle,
        imageUrl: obj.imageUrl,
        topicsCount: objTopics.length,
      });
    });

    return NextResponse.json({
      categories: Object.keys(categoriesMap).map((name) => ({
        name,
        items: categoriesMap[name],
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch topics' }, { status: 500 });
  }
}
