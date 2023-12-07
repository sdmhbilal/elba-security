/* eslint-disable @typescript-eslint/no-unsafe-call -- test conveniency */
/* eslint-disable @typescript-eslint/no-unsafe-return -- test conveniency */
import { http } from 'msw';
import { describe, expect, test, beforeEach } from 'vitest';
import { env } from '@/env';
import { server } from '../../vitest/setup-msw-handlers';
import { getToken } from './auth';
import { NotionError } from './commons/error';

const validCode = '1234';
const token = { access_token: 'token', workspace_id: 'workspaceId' };

describe('auth connector', () => {
  describe('getToken', () => {
    // mock token API endpoint using msw
    beforeEach(() => {
      server.use(
        http.post(`${env.NOTION_API_BASE_URL}/v1/oauth/token`, async ({ request }) => {
          // briefly implement API endpoint behaviour
          const data = (await request.json()) as { code: string };
          if (!data.code || data.code !== validCode) {
            return Response.json({ error_description: 'some description' }, { status: 401 });
          }
          return Response.json(token);
        })
      );
    });

    test('should return the token when the code is valid', async () => {
      await expect(getToken(validCode)).resolves.toStrictEqual(token);
    });

    test('should throw when the code is invalid', async () => {
      await expect(getToken('wrong-code')).rejects.toBeInstanceOf(NotionError);
    });
  });
});
