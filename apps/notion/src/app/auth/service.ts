import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { getToken } from '@/connectors/auth';
import { inngest } from '@/inngest/client';

export const setupOrganisation = async (organisationId: string, code: string) => {
  const { access_token: accessToken, workspace_id: workspaceId } = await getToken(code);

  await db
    .insert(Organisation)
    .values({
      id: organisationId,
      accessToken,
      workspaceId
    })
    .onConflictDoUpdate({
      target: Organisation.id,
      set: {
        accessToken,
        workspaceId,
      }
    });

  await inngest.send({
    name: 'notion/users.sync.requested',
    data: {
      isFirstSync: true,
      organisationId
    }
  });

  await inngest.send({
    name: 'request-organisations-users-sync',
  });
};
