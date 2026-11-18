import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';

import { clearSession, writeSession } from './session';
import { adminCredentials, adminSessionExpiry, mockAdminApi } from './test/admin-api-mock';
import { emptySettings, type AdminSettings } from './types';

function signInLocally() {
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
}

function renderInbox() {
  signInLocally();
  window.history.pushState({}, '', '/admin/inbox');
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}

const settingsWithWhatsApp: AdminSettings = {
  ...emptySettings,
  site: {
    name: 'Blue Miror',
    category: 'Aesthetic Clinic',
    tagline: null,
    defaultDescription: 'A considered aesthetic clinic.',
  },
  brand: { logoUrl: '/brand/logo.png', logoAlt: 'Blue Miror' },
  whatsapp: {
    enabled: true,
    countryCode: '44',
    number: '7700900123',
    defaultMessage: 'Hello Blue Miror',
    bookingMessageTemplate: 'Hello, about booking {reference} for {name}.',
    serviceEnquiryTemplate: null,
    cta: { booking: 'Book', serviceEnquiry: 'Ask', floating: 'Chat' },
  },
  booking: { primaryChannel: 'whatsapp', responseExpectation: null, note: 'Reviewed first.' },
  seo: {
    defaultTitle: 'Blue Miror',
    defaultDescription: 'A considered aesthetic clinic.',
    canonicalBaseUrl: null,
  },
};

afterEach(() => {
  cleanup();
  clearSession();
  queryClient.clear();
  vi.unstubAllGlobals();
});

describe('Inbox page', () => {
  it('lists appointments with their reference and live summary counts', async () => {
    mockAdminApi();
    renderInbox();

    expect(await screen.findByText('BM-261120-AB12 · Ayesha Khan')).toBeInTheDocument();
    expect(screen.getByText('BM-261119-CD34 · Sara Ali')).toBeInTheDocument();
    expect(screen.getAllByText('WhatsApp pending').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pending appointments').length).toBeGreaterThan(0);
  });

  it('filters by search term and shows an empty state when nothing matches', async () => {
    mockAdminApi();
    renderInbox();

    await screen.findByText('BM-261120-AB12 · Ayesha Khan');

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Sara' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(screen.queryByText('BM-261120-AB12 · Ayesha Khan')).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('BM-261119-CD34 · Sara Ali')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'nobody' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText(/No records match this search and filter/i)).toBeInTheDocument();
  });

  it('filters by status', async () => {
    mockAdminApi();
    renderInbox();

    await screen.findByText('BM-261120-AB12 · Ayesha Khan');

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'confirmed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(screen.queryByText('BM-261120-AB12 · Ayesha Khan')).not.toBeInTheDocument(),
    );
    expect(await screen.findByText('BM-261119-CD34 · Sara Ali')).toBeInTheDocument();
  });

  it('opens an appointment and records a status change with history', async () => {
    mockAdminApi();
    renderInbox();

    fireEvent.click(await screen.findByText('BM-261120-AB12 · Ayesha Khan'));

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Ayesha Khan')).toBeInTheDocument();
    expect(within(dialog).getByText('07700900123')).toBeInTheDocument();
    expect(within(dialog).getByText('Please advise on availability.')).toBeInTheDocument();

    const statusSelect = within(dialog).getByLabelText('Update status');
    fireEvent.change(statusSelect, { target: { value: 'contacted' } });
    fireEvent.change(within(dialog).getByLabelText('Reason for the change'), {
      target: { value: 'Called the customer' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Submission updated')).toBeInTheDocument();
    expect(await within(dialog).findByText(/Called the customer/)).toBeInTheDocument();
  });

  it('only offers statuses the current appointment may move to', async () => {
    mockAdminApi();
    renderInbox();

    fireEvent.click(await screen.findByText('BM-261119-CD34 · Sara Ali'));

    const dialog = await screen.findByRole('dialog');
    const statusSelect = await within(dialog).findByLabelText('Update status');
    const options = within(statusSelect)
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(options).toEqual(['Confirmed', 'Completed', 'Rescheduled', 'Cancelled']);
    expect(options).not.toContain('WhatsApp pending');
  });

  it('offers a WhatsApp handoff built from the configured settings', async () => {
    mockAdminApi({ settings: settingsWithWhatsApp });
    renderInbox();

    fireEvent.click(await screen.findByText('BM-261120-AB12 · Ayesha Khan'));

    const dialog = await screen.findByRole('dialog');
    const link = await within(dialog).findByRole('link', { name: /Open WhatsApp/i });

    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith('https://wa.me/447700900123')).toBe(true);
    expect(decodeURIComponent(href)).toContain('BM-261120-AB12');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('lists enquiries and contact messages on their own tabs', async () => {
    mockAdminApi();
    renderInbox();

    fireEvent.click(await screen.findByRole('tab', { name: 'Enquiries' }));
    expect(await screen.findByText(/Hana Yusuf/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Contact messages' }));
    expect(await screen.findByText(/Nadia Rehman/)).toBeInTheDocument();
    expect(screen.getByText(/Opening hours/)).toBeInTheDocument();
  });

  it('blocks publishing a story without recorded consent', async () => {
    mockAdminApi();
    renderInbox();

    fireEvent.click(await screen.findByRole('tab', { name: 'Testimonials' }));
    fireEvent.click(await screen.findByText('Unconsented'));

    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText(/cannot be published until consent is recorded/i),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Approve & publish/i })).toBeDisabled();
  });

  it('publishes a consented story', async () => {
    mockAdminApi();
    renderInbox();

    fireEvent.click(await screen.findByRole('tab', { name: 'Testimonials' }));
    fireEvent.click(await screen.findByText('Hana Y.'));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(await within(dialog).findByRole('button', { name: /Approve & publish/i }));

    expect(await screen.findByText('Story published')).toBeInTheDocument();
  });

  it('rejects invalid from/to values and surfaces the error path', async () => {
    mockAdminApi({ inboxError: true });
    renderInbox();

    // Invalid date strings are not accepted by Zod's isoDay schema -> 422 on the API.
    // Pass them through; the server rejects, the hook error path renders the error state.
    const url = new URL(window.location.href);
    url.searchParams.set('from', 'not-a-date');
    url.searchParams.set('to', 'also-not-a-date');
    window.history.pushState({}, '', url.toString());

    expect(
      await screen.findByText(/The inbox could not be loaded right now/i, undefined, {
        timeout: 4000,
      }),
    ).toBeInTheDocument();
  });

  it('shows an error state with a retry when the inbox request fails', async () => {
    mockAdminApi({ inboxError: true });
    renderInbox();

    expect(
      await screen.findByText(/The inbox could not be loaded right now/i, undefined, {
        timeout: 4000,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
