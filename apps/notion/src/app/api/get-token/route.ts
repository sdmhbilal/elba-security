import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type GrantTokenResponseData = {
  access_token: string,
  workspace_id: string,
  error_description?: string
};

type Request = {
  code: string
};

export async function POST(request: object) {
  try {
    const { code } = await request.json() as Request;

    const {
      CLIENT_ID: clientId,
      CLIENT_SECRET: clientSecret,
      REDIRECT_URI: redirectUri,
      ORGANIZATION_ID: organizationId = '',
      SOURCE_ID: sourceId = '',
      SOURCE_BASE_URL: sourceBaseUrl
    } = process.env;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const res = await fetch(`${sourceBaseUrl}/v1/oauth/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'grant_type': 'authorization_code',
        code,
        'redirect_uri': redirectUri
      })
    });
    const jsonResponse = await res.json() as GrantTokenResponseData;

    if (Object.keys(jsonResponse).length) {
      const {
        access_token: accessToken,
        workspace_id: workspaceId,
        error_description: errorDescription
      } = jsonResponse;

      if (accessToken && workspaceId) {
        await prisma.credential.upsert({
          where: {
            organizationId,
            sourceId
          },
          update: {
            accessToken,
            workspaceId
          },
          create: {
            organizationId,
            sourceId,
            accessToken,
            workspaceId
          }
        });
      } else if (errorDescription) {
        await prisma.$disconnect();

        return new NextResponse('Invalid code: this code has been revoked.', { status: 500, statusText: 'Invalid code: this code has been revoked.' });
      }
    }

    await prisma.$disconnect();

    return NextResponse.json({ status: 200, info: 'Token added successfully!!!' });
  } catch (error) {
    await prisma.$disconnect();

    return new NextResponse('Error in Get Token!!!', { status: 500, statusText: 'Error in Get Token!!!' });
  }
};
