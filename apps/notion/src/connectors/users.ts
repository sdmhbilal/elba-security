/**
 * DISCLAIMER:
 * This is an example connector, the function has a poor implementation. When requesting against API endpoint we might prefer
 * to valid the response data received using zod than unsafely assign types to it.
 * This might not fit your usecase if you are using a SDK to connect to the Saas.
 * These file illustrate potential scenarios and methodologies relevant for SaaS integration.
 */

import { NotionError } from './commons/error';

export type NotionUser = {
  id: string;
  username: string;
  email: string;
};

type GetUsersResponseData = { results: NotionUser[]; next_cursor: string | null };

export const getUsers = async (token: string, pageSize: string, sourceBaseUrl: string, page: string | null, notionVersion: string) => {
  let url = `${sourceBaseUrl}/v1/users?page_size=${pageSize}`;
  if (page) {
    url = `${sourceBaseUrl}/v1/users?page_size=${pageSize}&start_cursor=${page}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': notionVersion
    }
  });

  if (!response.ok) {
    throw new NotionError('Could not retrieve users', { response });
  }

  return response.json() as Promise<GetUsersResponseData>;
};

export const updateUsers = async (integrationBaseUrl: string, organisationId: string, sourceId: string, notionUsersList) => {
  await fetch(`${integrationBaseUrl}/rest/users`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      organisationId,
      sourceId,
      users: notionUsersList
    })
  });
};

export const deleteUsers = async (integrationBaseUrl: string, organisationId: string, sourceId: string, syncedBefore) => {
  await fetch(`${integrationBaseUrl}/rest/users`, {
    method: 'DELETE',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      organisationId,
      sourceId,
      syncedBefore
    })
  });
};
