import { NextRequest, NextResponse } from 'next/server';
import { isCloudConfigured, verifyAccessCode } from '@/lib/supabase-server';
import { uploadEventPhoto, upsertEvent, listEvents } from '@/lib/events-db';
import { DateIdea } from '@/lib/types';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isCloudConfigured()) {
    return NextResponse.json({ error: 'Cloud storage is not configured' }, { status: 503 });
  }

  const code = request.headers.get('x-access-code');
  if (!verifyAccessCode(code)) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are allowed' }, { status: 400 });
    }

    // Soft free-tier guard (~4MB)
    if (file.size > 4_000_000) {
      return NextResponse.json(
        { error: 'Please use a photo under 4MB so we stay on the free plan.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadEventPhoto(id, buffer, file.type, file.name);

    const existing = (await listEvents()).find((event) => event.id === id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Save the event first, then upload a photo.' },
        { status: 404 }
      );
    }

    const updated: DateIdea = {
      ...existing,
      imageDataUrl: uploaded.imageUrl,
      imageName: uploaded.imageName,
    };

    const saved = await upsertEvent(updated);
    return NextResponse.json({ event: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Photo upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
