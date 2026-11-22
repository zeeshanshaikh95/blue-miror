import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

  it('shows the clinic address and a booking fallback when WhatsApp is not configured', async () => {
    mockPublicApi();
    renderContact();

    expect((await screen.findAllByText(/Shop No\. 5, GH Society/i)).length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole('link', { name: /Request an appointment/i })
        .some((link) => link.getAttribute('href') === '/book'),
    ).toBe(true);
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

    expect(await screen.findByRole('heading', { name: 'WhatsApp' })).toBeInTheDocument();
    await waitFor(() => {
      const links = [...document.querySelectorAll('a[href^="https://wa.me/"]')];
      expect(links.length).toBeGreaterThan(0);
      expect(links[0]).toHaveAttribute('target', '_blank');
    });
  });
});
