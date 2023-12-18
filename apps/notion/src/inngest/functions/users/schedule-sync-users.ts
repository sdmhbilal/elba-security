import { GetEvents } from 'inngest';

import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { inngest } from '@/inngest/client';

type Events = GetEvents<typeof inngest>;

export const scheduleSyncUsers = inngest.createFunction(
  { id: 'request-organisations-users-sync' },
  { cron: 'TZ=Europe/Paris 0 23 * * *' },
  async ({ step }) => {
    const organisations = await db
    .select({ organisationId: Organisation.id })
    .from(Organisation);

    const events = organisations.map<Events['notion/users.sync.requested']>(
      (obj) => {
        return {
          name: 'notion/users.sync.requested',
          data: {
            organisationId: obj.organisationId,
            isFirstSync: false,
            syncStartedAt: Date.now(),
          }
        };
      }
    );

    await step.sendEvent('synchronize-users', events);
  }
);