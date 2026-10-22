import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { AuthBoundaryError } from '@/lib/auth/server';
import { requireBusinessActor } from '@/lib/tenant/server';
import { assertTrialActive } from '@/lib/billing/trial';
import { trialExpiredResponse } from '@/lib/billing/trial-response';

function validate(body: any) {
  const language = typeof body.language === 'string' ? body.language.trim() : '';
  const tone = typeof body.tone === 'string' ? body.tone.trim() : '';
  const workingHours = typeof body.workingHours === 'string' ? body.workingHours.trim() : '';
  const escalationContact = typeof body.escalationContact === 'string' ? body.escalationContact.trim() : '';
  const supportedServices = body.supportedServices;
  const faqs = body.faqs;
  if (!language || language.length > 40 || !tone || tone.length > 80 || workingHours.length > 500 || escalationContact.length > 160) throw new TypeError('INVALID_AGENT_SETTINGS');
  if (!Array.isArray(supportedServices) || supportedServices.length > 30 || supportedServices.some((item: unknown) => typeof item !== 'string' || !item.trim() || item.trim().length > 100)) throw new TypeError('INVALID_AGENT_SERVICES');
  if (!Array.isArray(faqs) || faqs.length > 30 || faqs.some((item: any) => !item || typeof item.question !== 'string' || typeof item.answer !== 'string' || item.question.trim().length < 1 || item.question.length > 250 || item.answer.trim().length < 1 || item.answer.length > 1000)) throw new TypeError('INVALID_AGENT_FAQS');
  return { language, tone, workingHours, escalationContact, supportedServices: supportedServices.map((item: string) => item.trim()), faqs: faqs.map((item: any) => ({ question: item.question.trim(), answer: item.answer.trim() })) };
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireBusinessActor(['owner', 'admin', 'member'], request.nextUrl.searchParams.get('businessId') || undefined);
    assertTrialActive(actor.business.subscription);
    const db = getAdminDb();
    const [business, connection] = await Promise.all([
      db.collection('businesses').doc(actor.businessId).get(),
      db.collection('whatsappConnections').doc(actor.businessId).get(),
    ]);
    const connectionData = connection.data() || {};
    const connected = connection.exists && connectionData.status === 'connected' && connectionData.businessId === actor.businessId && connectionData.webhookVerified === true;
    return NextResponse.json({ settings: business.data()?.agentSettings || { language: 'English', tone: 'Professional and helpful', workingHours: '', escalationContact: '', supportedServices: [], faqs: [], active: false }, connection: { connected, status: connected ? 'connected' : 'not_connected' } });
  } catch (error) {
    const expired = trialExpiredResponse(error);
    if (expired) return expired;
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    console.error('Workspace agent settings load failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to load agent settings.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body?.businessId !== 'string') return NextResponse.json({ error: 'Business workspace is required.' }, { status: 400 });
    const actor = await requireBusinessActor(['owner', 'admin'], body.businessId);
    assertTrialActive(actor.business.subscription);
    const settings = validate(body);
    await getAdminDb().collection('businesses').doc(actor.businessId).set({ agentSettings: { ...settings, updatedAt: FieldValue.serverTimestamp(), updatedBy: actor.uid } }, { merge: true });
    return NextResponse.json({ saved: true });
  } catch (error) {
    const expired = trialExpiredResponse(error);
    if (expired) return expired;
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    if (error instanceof TypeError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('Workspace agent settings save failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to save agent settings.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body?.businessId !== 'string' || body.activate !== true) return NextResponse.json({ error: 'Unsupported activation action.' }, { status: 400 });
    const actor = await requireBusinessActor(['owner', 'admin'], body.businessId);
    assertTrialActive(actor.business.subscription);
    const connection = await getAdminDb().collection('whatsappConnections').doc(actor.businessId).get();
    const data = connection.data() || {};
    if (!connection.exists || data.businessId !== actor.businessId || data.status !== 'connected' || data.webhookVerified !== true || !data.phoneNumberId) {
      return NextResponse.json({ error: 'WhatsApp is not connected. Complete Meta Business authorization and verify the phone number and webhook before activation.' }, { status: 409 });
    }
    await getAdminDb().collection('businesses').doc(actor.businessId).update({ 'agentSettings.active': true, 'agentSettings.updatedAt': FieldValue.serverTimestamp(), 'agentSettings.updatedBy': actor.uid });
    return NextResponse.json({ active: true });
  } catch (error) {
    const expired = trialExpiredResponse(error);
    if (expired) return expired;
    if (error instanceof AuthBoundaryError) return NextResponse.json({ error: error.code }, { status: error.code === 'UNAUTHENTICATED' ? 401 : 403 });
    console.error('Workspace agent activation failed:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to activate the agent.' }, { status: 500 });
  }
}
