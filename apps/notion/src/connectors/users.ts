import { NotionError } from './commons/error';

type Person = {
  email: string;
};

export type NotionUser = {
  id: string;
  object: string;
  name: string;
  person: Person;
  type: string;
};

export type ElbaUser = {
  id: string;
  displayName: string;
  email: string;
  additionalEmails: string[];
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

export const updateUsers = async (integrationBaseUrl: string, organisationId: string, sourceId: string, users: ElbaUser[]) => {
  const response = await fetch(`${integrationBaseUrl}/rest/users`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      organisationId,
      sourceId,
      users
    })
  });

  if (!response.ok) {
    throw new NotionError('Could not update users', { response });
  }
};

export const deleteUsers = async (integrationBaseUrl: string, organisationId: string, sourceId: string, syncedBefore: Date) => {
  const response = await fetch(`${integrationBaseUrl}/rest/users`, {
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

  if (!response.ok) {
    throw new NotionError('Could not delete users', { response });
  }
};
