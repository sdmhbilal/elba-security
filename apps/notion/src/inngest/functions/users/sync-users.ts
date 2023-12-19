import { eq } from 'drizzle-orm';
import { NonRetriableError } from 'inngest';
import { type NotionUser, type ElbaUser, deleteUsers, getUsers, updateUsers } from '@/connectors/users';
import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { env } from '@/env';
import { inngest } from '@/inngest/client';

const formatElbaUser = (user: NotionUser): ElbaUser => ({
  id: user.id,
  displayName: user.name,
  email: user.person.email,
  additionalEmails: [],
});

export const syncUsers = inngest.createFunction(
  {
    id: 'synchronize-users',
    priority: { run: 'event.data.is_first_scan ? 600 : -600' },
  }, {
    event: 'notion/users.sync.requested'
  },
  async ({ event, step }) => {
    const { organisationId, syncStartedAt, page } = event.data;

    const {
      ELBA_API_BASE_URL: integrationBaseUrl,
      NOTION_VERSION: notionVersion,
      NOTION_API_BASE_URL: sourceBaseUrl,
      ELBA_SOURCE_ID: sourceId,
      USERS_SYNC_JOB_BATCH_SIZE: pageSize,
    } = env;

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
      const result = await getUsers(
        token,
        pageSize,
        sourceBaseUrl,
        page,
        notionVersion
      );

      const { next_cursor: nextPageCursor } = result;

      const users = result.results.filter((user) => user.object === 'user' && user.type === 'person').map(formatElbaUser);

      await updateUsers(integrationBaseUrl, organisationId, sourceId, users);

      return nextPageCursor;
    });

    if (nextPage) {
      await step.sendEvent('synchronize-users', {
        name: 'notion/users.sync.requested',
        data: {
          ...event.data,
          page: nextPage,
        },
      });

      return {
        status: 'ongoing',
      };
    }

    await deleteUsers(integrationBaseUrl, organisationId, sourceId, syncStartedAt);
  }
);
