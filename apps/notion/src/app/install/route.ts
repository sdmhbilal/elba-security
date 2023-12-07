import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';
import { env } from '@/env';

// Remove the next line if your integration does not works with edge runtime
export const preferredRegion = env.VERCEL_PREFERRED_REGION;
// Remove the next line if your integration does not works with edge runtime
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const organisationId = request.nextUrl.searchParams.get('organisation_id');

  if (!organisationId) {
    redirect(`${env.ELBA_REDIRECT_URL}?error=true`);
  }

  const redirectUrl = new URL(`${env.NOTION_API_BASE_URL}/v1/oauth/authorize`);
  redirectUrl.searchParams.append('client_id', env.NOTION_CLIENT_ID);
  redirectUrl.searchParams.append('response_type', 'code');
  redirectUrl.searchParams.append('owner', 'user');
  redirectUrl.searchParams.append('redirect_uri', env.NOTION_REDIRECT_URL);
  redirectUrl.searchParams.append('state', organisationId);

  redirect(redirectUrl.toString());
}
