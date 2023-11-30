'use client';

import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast';

type ResponseData = {
  info: string
}

type ApiResponse = {
  data: ResponseData
}

const getToken = async (authCode: string) => {
  try {
    const res: ApiResponse = await axios.post(`${process.env.API_URL}/api/get-token`, {
      code: authCode
    });

    toast.success(res.data.info);
  } catch (error) {
    toast.error(error.response.data);
  }
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
    async function fetchData() {
      await getToken(authCode)
    };

    if (authCode) {
      fetchData();
    }
  }, [authCode]);

  return (
    <main>
      <div>
        <Toaster />
        Come back to Integrating Website
      </div>
    </main>
  )
};
