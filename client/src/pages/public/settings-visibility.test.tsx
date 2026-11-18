import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';
import type { SiteSettings } from '@/services/public-content';
import { mockPublicApi, testSettings } from '@/test/public-api-mock';

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}

function withSettings(overrides: Partial<SiteSettings>) {
  mockPublicApi({ settingsOverrides: { ...testSettings, ...overrides } });
}

const whatsappConfigured = {
  whatsapp: {
    ...testSettings.whatsapp,
    enabled: true,
    countryCode: '44',
    number: '7700900123',
    showFloatingButton: true,
  },
};

describe('settings-driven public visibility', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it('still renders configured settings when the optional tagline is null', async () => {
    withSettings({
      site: { ...testSettings.site, tagline: null },
      whatsapp: whatsappConfigured.whatsapp,
    });
    renderAt('/');

    expect(await screen.findByRole('link', { name: /chat on whatsapp/i })).toBeInTheDocument();
  });

  it('shows the floating WhatsApp button when enabled', async () => {
    withSettings(whatsappConfigured);
    renderAt('/');

    const button = await screen.findByRole('link', { name: /chat on whatsapp/i });
    expect(button).toHaveAttribute('href', expect.stringContaining('https://wa.me/'));
  });

  it('hides the floating WhatsApp button when the clinic turns it off', async () => {
    withSettings({
      whatsapp: { ...whatsappConfigured.whatsapp, showFloatingButton: false },
    });
    renderAt('/');

    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('link', { name: /chat on whatsapp/i })).not.toBeInTheDocument();
  });

  it('shows a paused notice instead of the booking form when requests are disabled', async () => {
    withSettings({
      booking: {
        primaryChannel: 'whatsapp',
        responseExpectation: null,
        note: 'Reviewed before confirmation.',
        enabled: false,
      },
    });
    renderAt('/book');

    expect(await screen.findByText(/online requests are paused/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it('renders the booking form when requests are enabled', async () => {
    withSettings({
      booking: {
        primaryChannel: 'whatsapp',
        responseExpectation: null,
        note: 'Reviewed before confirmation.',
        enabled: true,
      },
    });
    renderAt('/book');

    expect(await screen.findByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.queryByText(/online requests are paused/i)).not.toBeInTheDocument();
  });
});
