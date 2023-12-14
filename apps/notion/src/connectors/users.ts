/**
 * DISCLAIMER:
 * This is an example connector, the function has a poor implementation. When requesting against API endpoint we might prefer
 * to valid the response data received using zod than unsafely assign types to it.
 * This might not fit your usecase if you are using a SDK to connect to the Saas.
 * These file illustrate potential scenarios and methodologies relevant for SaaS integration.
 */

export type MySaasUser = {
  id: string;
  username: string;
  email: string;
};

type GetUsersResponseData = { results: MySaasUser[]; next_cursor: string | null };

export const getUsers = async (token: string, pageSize: string, sourceBaseUrl: string, nextCursor: string | null, notionVersion: string) => {
  let url = `${sourceBaseUrl}/v1/users?page_size=${pageSize}`;
  if (nextCursor) {
    url = `${sourceBaseUrl}/v1/users?page_size=${pageSize}&start_cursor=${nextCursor}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': notionVersion
    }
  });

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
