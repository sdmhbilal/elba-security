import { expect, test, describe, vi, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/database/client';
import { env } from '@/env';
import { Organisation } from '@/database/schema';
import { inngest } from '@/inngest/client';
import * as usersConnector from '@/connectors/auth';
import { setupOrganisation } from './service';

const invalidCode = 'invalid_code_abc';

const token = env.NOTION_CLIENT_SECRET;
const now = new Date();

const organisation = {
  id: 'b91f113b-bcf9-4a28-98c7-5b13fb671c19',
  accessToken: token,
  workspaceId: '0b71731f-04a8-4d78-9be0-6b28b09ab4e4'
};

describe('setupOrganisation', () => {
  beforeAll(() => {
    vi.setSystemTime(now);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test('should get token when the code is valid', async () => {
    vi.spyOn(usersConnector, 'getToken').mockResolvedValue({
      accessToken: token,
      workspaceId: organisation.workspaceId
    });
  }, 10000);

  test('should setup organisation when the code is valid and the organisation is not registered', async () => {
    const send = vi.spyOn(inngest, 'send').mockResolvedValue(undefined);

    await db.insert(Organisation).values(organisation);

    await inngest.send({
      name: 'notion/users.sync.requested',
      data: {
        isFirstSync: true,
        organisationId: organisation.id,
        syncStartedAt: new Date(),
        page: null
      }
    });

    await expect(
      db
        .select({ token: Organisation.accessToken })
        .from(Organisation)
        .where(eq(Organisation.id, organisation.id))
    ).resolves.toMatchObject([
      {
        token,
      },
    ]);

    expect(send).toBeCalledTimes(1);
  }, 10000);

  test('should setup organisation when the code is valid and the organisation is already registered', async () => {
    const send = vi.spyOn(inngest, 'send').mockResolvedValue(undefined);
    await db.insert(Organisation).values(organisation);

    await inngest.send({
      name: 'notion/users.sync.requested',
      data: {
        isFirstSync: true,
        organisationId: organisation.id,
        syncStartedAt: new Date(),
        page: null
      }
    });

    await expect(
      db
        .select({ token: Organisation.accessToken })
        .from(Organisation)
        .where(eq(Organisation.id, organisation.id))
    ).resolves.toMatchObject([
      {
        token,
      },
    ]);

    expect(send).toBeCalledTimes(1);
  }, 10000);

  test('should not setup the organisation when the code is invalid', async () => {
    const send = vi.spyOn(inngest, 'send').mockResolvedValue(undefined);
    const error = new Error('Could not retrieve token');
    const getToken = vi.spyOn(usersConnector, 'getToken').mockRejectedValue(error);

    await expect(setupOrganisation(organisation.id, invalidCode)).rejects.toThrowError(error);

    expect(getToken).toBeCalledTimes(1);

    await expect(
      db.select().from(Organisation).where(eq(Organisation.id, organisation.id))
    ).resolves.toHaveLength(0);

    expect(send).toBeCalledTimes(0);
  }, 10000);
});
