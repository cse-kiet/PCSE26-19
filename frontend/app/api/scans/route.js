// app/api/scans/route.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST — save a new scan
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { grade, gradeName, confidence, probabilities, remedy, patientName, patientAge, patientId } = body;

    const scan = await prisma.scan.create({
      data: {
        userId: session.user.id,
        grade,
        gradeName,
        confidence,
        probabilities: JSON.stringify(probabilities),
        remedy: JSON.stringify(remedy),
        patientName: patientName || null,
        patientAge: patientAge || null,
        patientId: patientId || null,
      },
    });

    return Response.json({ success: true, scanId: scan.id });
  } catch (err) {
    console.error('Save scan error:', err);
    return Response.json({ error: 'Failed to save scan' }, { status: 500 });
  }
}

// GET — fetch all scans for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const scans = await prisma.scan.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = scans.map((s) => ({
      ...s,
      probabilities: JSON.parse(s.probabilities),
      remedy: JSON.parse(s.remedy),
    }));

    return Response.json({ scans: parsed });
  } catch (err) {
    console.error('Fetch scans error:', err);
    return Response.json({ error: 'Failed to fetch scans' }, { status: 500 });
  }
}
