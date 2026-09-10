import { NextRequest, NextResponse } from 'next/server';
import { getCompetitionSettings, updateCompetitionSettings } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await getCompetitionSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      submissionsOpen,
      votingOpen,
      submissionDeadline,
      votingDeadline,
    } = body;

    await updateCompetitionSettings({
      submissionsOpen,
      votingOpen,
      submissionDeadline: submissionDeadline || null,
      votingDeadline: votingDeadline || null,
      updatedBy: session.email || session.uid,
    });

    const updated = await getCompetitionSettings();
    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    console.error('Error updating settings:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
