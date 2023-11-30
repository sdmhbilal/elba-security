'use client';

import React, { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    window.open(`${process.env.SOURCE_BASE_URL}/v1/oauth/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&owner=user&redirect_uri=${process.env.REDIRECT_URI}`, '_self');
  }, []);

  return <main>Elba x Saas</main>;
};
