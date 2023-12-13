import { RedirectType } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { env } from '@/env';

import { setupOrganisation } from './service';

export const preferredRegion = env.VERCEL_PREFERRED_REGION;
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const cookieStore = cookies()
  const organisationId = cookieStore.get('organisation_id')?.value;
  if (!organisationId || !code) {
    return NextResponse.redirect(`${env.ELBA_REDIRECT_URL}?error=true`, RedirectType.replace);
  }

  await setupOrganisation(organisationId, code);

  return new NextResponse(null, { status: 200, statusText: 'Syncing Users to Elba!' });

};
