'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'

const getToken = async (authCode: string) => {
  await fetch(`${process.env.API_URL}/api/get-token`, {
    method: 'POST',
    body: JSON.stringify({
      code: authCode
    })
  });
};

export default function Home() {
  const [authCode, setAuthCode] = useState('');

  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  useEffect(() => {
    if (code) {
      setAuthCode(code);
    }
  }, []);

  useEffect(() => {
    async function getTokenHelper() {
      await getToken(authCode)
    };

    if (authCode) {
      getTokenHelper();
    }
  }, [authCode]);

  return (
    <main> Come back to Integrating Website </main>
  )
};
