import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const REELS = [
  {
    id: 1,
    src: '/videos/whatsapp_story_1.mp4#t=0.1',
    poster: '',
    title: 'Morning Milking',
    subtitle: 'Daily Care',
    duration: '01:25',
    description: 'We start our day with healthy cows and clean, hygienic milking.',
    badgeNumber: '01',
  },
  {
    id: 2,
    src: '/videos/whatsapp_story_2.mp4#t=0.1',
    poster: '',
    title: 'Fresh Delivery',
    subtitle: 'Delivered',
    duration: '01:18',
    description: 'Delivered before sunrise to ensure freshness at your doorstep.',
    badgeNumber: '02',
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countParam = searchParams.get('count');
    
    let resultReels = REELS;
    if (countParam) {
      const count = parseInt(countParam, 10);
      if (!isNaN(count) && count > 0) {
        if (count <= REELS.length) {
          resultReels = REELS.slice(0, count);
        } else {
          resultReels = [];
          for (let i = 0; i < count; i++) {
            const template = REELS[i % REELS.length];
            resultReels.push({
              ...template,
              id: i + 1,
              badgeNumber: String(i + 1).padStart(2, '0'),
              title: `${template.title} Part ${Math.floor(i / REELS.length) + 1}`,
            });
          }
        }
      }
    }
    
    return NextResponse.json({ success: true, reels: resultReels });
  } catch (error: any) {
    console.error('Error serving videos list:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
