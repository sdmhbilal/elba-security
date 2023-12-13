import type { User } from '@elba-security/sdk';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { NonRetriableError } from 'inngest';
import { type MySaasUser, deleteUsers, getUsers, updateUsers } from '@/connectors/users';
import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { inngest } from '@/inngest/client';

const formatElbaUser = (user: MySaasUser): User => ({
  id: user.id,
  displayName: user?.name,
  email: user?.person?.email,
  additionalEmails: [],
});

type EventData = {
  organisationId: string,
  syncStartedAt?: Date,
  page?: string
};

type GetUserResult = {
  next_cursor?: string,
  results: []
};

export const syncUsers = inngest.createFunction(
  {
    id: 'synchronize-users',
    priority: { run: 'event.data.is_first_scan' ? 600 : -600 }
  },
  { event: 'notion/users.sync.requested' },
  async ({ event, step }) => {
    try {
      const {
        organisationId,
        syncStartedAt = new Date(),
        page: nextPageToken
      } = event.data as EventData;

      const syncTime = syncStartedAt;

      const {
        INTEGRAION_BASE_URL: integrationBaseUrl,
        NOTION_VERSION: notionVersion,
        SOURCE_BASE_URL: sourceBaseUrl,
        SOURCE_ID: sourceId,
        USERS_SYNC_JOB_BATCH_SIZE: pageSize
      } = process.env;

      let nextCursor = nextPageToken;

      const token = await step.run('get-token', async () => {
        const [organisation] = await db
          .select({ token: Organisation.accessToken })
          .from(Organisation)
          .where(eq(Organisation.id, organisationId));
        
        if (!organisation) {
          throw new NonRetriableError(`Could not retrieve organisation with id=${organisationId}`);
        }

        return organisation.token;
      });

      const nextPage = await step.run('list-users', async () => {
        const result = await getUsers(token, pageSize, sourceBaseUrl, nextCursor, notionVersion) as GetUserResult;
        const { next_cursor: nextPageCursor } = result;
        let users = result.results.filter(user => user.object === 'user');

        users = users.map(formatElbaUser);
        await updateUsers(integrationBaseUrl, organisationId, sourceId, users);

        return nextPageCursor;
      });

      nextCursor = nextPage;

      if (nextCursor) {
        await step.sendEvent('synchronize-users', {
          name: 'notion/users.sync.requested',
          data: {
            ...event.data,
            page: nextCursor,
            syncStartedAt: syncTime
          }
        });

        return {
          status: 'ongoing'
        };
      }
    
      await deleteUsers(integrationBaseUrl, organisationId, sourceId, syncTime);
    } catch (error) {
      return new NextResponse(error.message, { status: 500, statusText: 'Unknown Error' });
    }
  }
);
