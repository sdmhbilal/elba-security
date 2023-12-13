import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { getToken } from '@/connectors/auth';
import { inngest } from '@/inngest/client';

export const setupOrganisation = async (organisationId: string, code: string) => {
  const { access_token: accessToken, workspace_id: workspaceId } = await getToken(code);

  try {
    await db
    .insert(Organisation)
    .values({
      id: organisationId,
      accessToken,
      workspaceId
    });

    await inngest.send({
      name: 'notion/users.sync.requested',
      data: {
        isFirstSync: true,
        organisationId
      }
    });
  } catch (error) {
    return new NextResponse(error.message, { status: 500, statusText: 'Unknown Error' });
  }
};
