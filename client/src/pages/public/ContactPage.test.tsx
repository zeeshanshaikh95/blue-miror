import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';
import { mockPublicApi, testSettings } from '@/test/public-api-mock';

function renderContact() {
  window.history.pushState({}, '', '/contact');
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}

describe('ContactPage', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it('publishes no invented contact details when settings are empty', async () => {
    mockPublicApi();
    renderContact();

    expect(
      await screen.findByText(/The verified WhatsApp number is not yet configured/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Phone number pending verification/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'How booking works' })).toHaveAttribute(
      'href',
      '/book',
    );
    expect(document.querySelector('a[href^="https://wa.me/"]')).toBeNull();
  });

  it('renders a configured WhatsApp booking link from settings', async () => {
    mockPublicApi({
      settingsOverrides: {
        ...testSettings,
        whatsapp: {
          ...testSettings.whatsapp,
          enabled: true,
          countryCode: '44',
          number: '7700900123',
          defaultMessage: 'Hello Blue Miror',
        },
      },
    });
    renderContact();

    expect(
      await screen.findByText(/begin a booking request through the clinic’s verified WhatsApp/i),
    ).toBeInTheDocument();
    const links = [...document.querySelectorAll('a[href^="https://wa.me/"]')];
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('target', '_blank');
  });
});
