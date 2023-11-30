import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Text = {
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

    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const myHeaders = new Headers();
    myHeaders.append('Authorization', `Basic ${encoded}`);
    myHeaders.append('Content-Type', 'application/json');

    const data = JSON.stringify({
      'grant_type': 'authorization_code',
      code,
      'redirect_uri': redirectUri
    });

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: data
    };

    const res  = await fetch(`${sourceBaseUrl}/v1/oauth/token`, requestOptions);
    const text = await res.json() as Text;

    if (Object.keys(text).length) {
      const {
        access_token: accessToken,
        workspace_id: workspaceId,
        error_description: errorDescription
      } = text;

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
