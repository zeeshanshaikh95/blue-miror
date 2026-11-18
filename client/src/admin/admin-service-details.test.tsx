import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';

import { clearSession, writeSession } from './session';
import { adminCredentials, adminSessionExpiry, mockAdminApi } from './test/admin-api-mock';

function renderServices() {
  const mock = mockAdminApi();
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
  window.history.pushState({}, '', '/admin/services');
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  return mock;
}

async function fillRequiredFields(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText(/service name/i), {
    target: { value: 'Consultation review' },
  });
  fireEvent.change(within(dialog).getByLabelText(/category/i), {
    target: { value: 'consultations' },
  });
  fireEvent.change(within(dialog).getByLabelText(/short description/i), {
    target: { value: 'A focused review.' },
  });
  fireEvent.change(within(dialog).getByLabelText(/overview/i), {
    target: { value: 'An overview paragraph.' },
  });
  fireEvent.change(within(dialog).getByLabelText(/procedure steps/i), {
    target: { value: 'Consultation' },
  });
  fireEvent.change(within(dialog).getByLabelText(/^benefits/i), {
    target: { value: 'Clarity' },
  });
  fireEvent.change(within(dialog).getByLabelText(/considerations/i), {
    target: { value: 'Assessment required' },
  });
  fireEvent.change(within(dialog).getByLabelText(/faq 1 question/i), {
    target: { value: 'Is it suitable?' },
  });
  fireEvent.change(within(dialog).getByLabelText(/faq 1 answer/i), {
    target: { value: 'Discussed at consultation.' },
  });
}

describe('service optional details', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    clearSession();
    vi.unstubAllGlobals();
  });

  it('saves duration, price, SEO copy and related services', async () => {
    const { fetchMock } = renderServices();

    fireEvent.click(await screen.findByRole('button', { name: /new service/i }));
    const dialog = await screen.findByRole('dialog');

    await fillRequiredFields(dialog);
    fireEvent.change(within(dialog).getByLabelText(/price \(optional\)/i), {
      target: { value: 'From £95' },
    });
    fireEvent.change(within(dialog).getByLabelText(/duration \(optional\)/i), {
      target: { value: '45 minutes' },
    });
    fireEvent.change(within(dialog).getByLabelText(/seo title/i), {
      target: { value: 'Skin consultation in London' },
    });
    fireEvent.change(within(dialog).getByLabelText(/seo description/i), {
      target: { value: 'A considered consultation with a clear plan.' },
    });
    fireEvent.change(within(dialog).getByLabelText(/related services/i), {
      target: { value: 'led-therapy, skin-consultation' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: /create service/i }));

    expect(await screen.findByText(/service created/i)).toBeInTheDocument();

    const post = fetchMock.mock.calls.find(
      ([, init]) => (init as { method?: string } | undefined)?.method === 'POST',
    );
    const body = JSON.parse((post?.[1] as { body?: string }).body ?? '{}') as {
      price: string | null;
      duration: string | null;
      seo: { title: string | null; description: string | null };
      relatedSlugs: string[];
      image: unknown;
    };

    expect(body.price).toBe('From £95');
    expect(body.duration).toBe('45 minutes');
    expect(body.seo.title).toBe('Skin consultation in London');
    expect(body.relatedSlugs).toEqual(['led-therapy', 'skin-consultation']);
    // No image was supplied, so nothing invented is stored.
    expect(body.image).toBeNull();
  });

  it('leaves optional fields empty when the clinic has not supplied them', async () => {
    const { fetchMock } = renderServices();

    fireEvent.click(await screen.findByRole('button', { name: /new service/i }));
    const dialog = await screen.findByRole('dialog');
    await fillRequiredFields(dialog);

    fireEvent.click(within(dialog).getByRole('button', { name: /create service/i }));
    expect(await screen.findByText(/service created/i)).toBeInTheDocument();

    const post = fetchMock.mock.calls.find(
      ([, init]) => (init as { method?: string } | undefined)?.method === 'POST',
    );
    const body = JSON.parse((post?.[1] as { body?: string }).body ?? '{}') as {
      price: string | null;
      duration: string | null;
      relatedSlugs: string[];
    };

    expect(body.price).toBeNull();
    expect(body.duration).toBeNull();
    expect(body.relatedSlugs).toEqual([]);
  });

  it('rejects malformed related-service slugs', async () => {
    const { fetchMock } = renderServices();

    fireEvent.click(await screen.findByRole('button', { name: /new service/i }));
    const dialog = await screen.findByRole('dialog');
    await fillRequiredFields(dialog);

    fireEvent.change(within(dialog).getByLabelText(/related services/i), {
      target: { value: 'Not A Slug!' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /create service/i }));

    expect(
      await within(dialog).findByText(/lowercase slugs separated by commas/i),
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(
        ([, init]) => (init as { method?: string } | undefined)?.method === 'POST',
      ),
    ).toHaveLength(0);
  });
});
