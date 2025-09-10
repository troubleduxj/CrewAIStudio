'use client';

import { NextIntlClientProvider } from 'next-intl';
import { SWRConfig } from 'swr';
import { fetcher } from '@/lib/api';

interface ClientProvidersProps {
  children: React.ReactNode;
  messages: any;
  locale: string;
}

export function ClientProviders({ children, messages, locale }: ClientProvidersProps) {
  return (
    <SWRConfig value={{ fetcher }}>
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </SWRConfig>
  );
}