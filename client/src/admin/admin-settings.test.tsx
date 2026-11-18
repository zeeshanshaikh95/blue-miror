import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';

import { clearSession, writeSession } from './session';
import { adminCredentials, adminSessionExpiry, mockAdminApi } from './test/admin-api-mock';
import { emptyHomepage, emptySettings, type AdminSettings } from './types';

const settings: AdminSettings = {
  ...emptySettings,
  site: {
    name: 'Blue Miror',
    category: 'Aesthetic Clinic',
    tagline: 'Aesthetic care, considered.',
    defaultDescription: 'A service-led aesthetic clinic.',
  },
  brand: { logoUrl: '/brand/blue-miror-logo.png', logoAlt: 'Blue Miror crest' },
  whatsapp: {
    enabled: true,
    countryCode: '+44',
    number: '7700900123',
    defaultMessage: 'Hello',
    bookingMessageTemplate: null,
    serviceEnquiryTemplate: null,
    cta: { booking: 'Book', serviceEnquiry: 'Ask', floating: 'Chat on WhatsApp' },
    showFloatingButton: true,
  },
  booking: {
    primaryChannel: 'whatsapp',
    responseExpectation: 'Within one business day.',
    note: 'Every request is reviewed before confirmation.',
    enabled: true,
  },
  seo: { defaultTitle: 'Blue Miror', defaultDescription: 'A clinic.', canonicalBaseUrl: null },
  homepage: emptyHomepage,
};

function renderSettings(options: Parameters<typeof mockAdminApi>[0] = {}) {
  const mock = mockAdminApi({ settings, ...options });
  writeSession({
    token: 'test-session-token',
    expiresAt: adminSessionExpiry(),
    admin: {
      id: 'admin-1',
      email: adminCredentials.email,
      name: adminCredentials.email,
      role: 'superadmin',
    },
  });
  window.history.pushState({}, '', '/admin/settings');
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  return mock;
}

function lastSettingsBody(fetchMock: ReturnType<typeof mockAdminApi>['fetchMock']) {
  const call = fetchMock.mock.calls.filter(
    ([, init]) => (init as { method?: string } | undefined)?.method === 'PUT',
  );
  const last = call[call.length - 1];
  const body = (last?.[1] as { body?: string } | undefined)?.body;
  return body ? (JSON.parse(body) as AdminSettings) : null;
}

describe('admin website settings', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    clearSession();
    vi.unstubAllGlobals();
  });

  it('saves homepage copy and section visibility', async () => {
    const { fetchMock } = renderSettings();

    const heading = await screen.findByLabelText(/hero heading/i);
    fireEvent.change(heading, { target: { value: 'Care that starts with a conversation.' } });

    fireEvent.change(screen.getByLabelText(/hero description/i), {
      target: { value: 'A calm clinic experience.' },
    });
    fireEvent.click(screen.getByLabelText(/show the gallery preview/i));

    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));
    expect(await screen.findByText(/website settings saved/i)).toBeInTheDocument();

    const body = lastSettingsBody(fetchMock);
    // The read-only document id must never be echoed into the strict write schema.
    expect((body as { id?: string } | null)?.id).toBeUndefined();
    expect(body?.homepage?.heroHeading).toBe('Care that starts with a conversation.');
    expect(body?.homepage?.heroDescription).toBe('A calm clinic experience.');
    expect(body?.homepage?.showGallery).toBe(false);
    expect(body?.homepage?.showFeatured).toBe(true);
  });

  it('persists the booking and floating WhatsApp toggles', async () => {
    const { fetchMock } = renderSettings();

    const bookingToggle = await screen.findByLabelText(/accept new appointment requests/i);
    const floatingToggle = screen.getByLabelText(/show the floating whatsapp button/i);
    expect(bookingToggle).toBeChecked();
    expect(floatingToggle).toBeChecked();

    fireEvent.click(bookingToggle);
    fireEvent.click(floatingToggle);
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    expect(await screen.findByText(/website settings saved/i)).toBeInTheDocument();

    const body = lastSettingsBody(fetchMock);
    expect(body?.booking.enabled).toBe(false);
    expect(body?.whatsapp.showFloatingButton).toBe(false);
  });

  it('reports a failed save without claiming success', async () => {
    renderSettings({ settingsWriteError: true });

    const heading = await screen.findByLabelText(/hero heading/i);
    fireEvent.change(heading, { target: { value: 'A changed heading.' } });
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    const messages = await screen.findAllByText(/could not be saved/i);
    expect(messages.length).toBeGreaterThan(0);
    expect(screen.queryByText(/website settings saved/i)).not.toBeInTheDocument();
  });

  it('keeps the settings form labelled for assistive technology', async () => {
    renderSettings();

    await screen.findByLabelText(/hero heading/i);
    expect(screen.getByLabelText(/show featured treatments/i)).toHaveAttribute(
      'id',
      'setting-home-showFeatured',
    );
  });
});
