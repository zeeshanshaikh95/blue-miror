import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';

import { clearSession, writeSession } from './session';
import {
  adminCredentials,
  adminSessionExpiry,
  mockAdminApi,
  type MockOptions,
} from './test/admin-api-mock';
import { emptySettings, type AdminSettings } from './types';

const filledSettings: AdminSettings = {
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
    cta: {
      booking: 'Book a consultation',
      serviceEnquiry: 'Ask about this treatment',
      floating: 'Chat on WhatsApp',
    },
  },
  booking: {
    primaryChannel: 'whatsapp',
    responseExpectation: 'Within one business day.',
    note: 'Every request is reviewed before confirmation.',
  },
  seo: {
    defaultTitle: 'Blue Miror',
    defaultDescription: 'A considered aesthetic clinic.',
    canonicalBaseUrl: null,
  },
};

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

function renderAt(path: string, options: MockOptions = {}) {
  const mock = mockAdminApi(options);
  signInLocally();
  window.history.pushState({}, '', path);
  render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
  return mock;
}

describe('admin content management', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    clearSession();
    vi.unstubAllGlobals();
  });

  it('lists services and creates a new one', async () => {
    renderAt('/admin/services');

    expect(await screen.findByText('Skin consultation')).toBeInTheDocument();
    expect(screen.getByText('/led-therapy')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /new service/i }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(/service name/i), {
      target: { value: 'Brow consultation' },
    });
    fireEvent.change(within(dialog).getByLabelText(/category/i), {
      target: { value: 'consultations' },
    });
    fireEvent.change(within(dialog).getByLabelText(/short description/i), {
      target: { value: 'A focused brow assessment.' },
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
      target: { value: 'At consultation.' },
    });

    fireEvent.click(within(dialog).getByRole('button', { name: /create service/i }));

    expect(await screen.findByText('Brow consultation')).toBeInTheDocument();
    expect(await screen.findByText(/service created/i)).toBeInTheDocument();
  });

  it('validates required service fields before saving', async () => {
    const { fetchMock } = renderAt('/admin/services');

    fireEvent.click(await screen.findByRole('button', { name: /new service/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /create service/i }));

    expect(await within(dialog).findByText(/a service name is required/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/a url slug is required/i)).toBeInTheDocument();

    const postCalls = fetchMock.mock.calls.filter(
      ([, init]) => (init as { method?: string } | undefined)?.method === 'POST',
    );
    expect(postCalls).toHaveLength(0);
  });

  it('archives a service only after confirmation', async () => {
    renderAt('/admin/services');

    const row = (await screen.findByText('Skin consultation')).closest('tr');
    expect(row).not.toBeNull();

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: /archive/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/archive this service/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /archive service/i }));

    await waitFor(() => expect(screen.queryByText('Skin consultation')).not.toBeInTheDocument());
    expect(await screen.findByText(/service archived/i)).toBeInTheDocument();
  });

  it('blocks deleting a category that is still used by services', async () => {
    renderAt('/admin/categories');

    const row = (await screen.findByText('Consultations')).closest('tr');
    expect(row).not.toBeNull();

    const archiveButton = within(row as HTMLElement).getByRole('button', { name: /archive/i });
    expect(archiveButton).toBeDisabled();
    expect(archiveButton).toHaveAttribute('title', 'Reassign the services in this category first.');
  });

  it('creates a category', async () => {
    renderAt('/admin/categories');

    fireEvent.click(await screen.findByRole('button', { name: /new category/i }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/^name/i), {
      target: { value: 'Facial care' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /create category/i }));

    expect(await screen.findByText('Facial care')).toBeInTheDocument();
  });

  it('creates a gallery item with alt text', async () => {
    const { state } = renderAt('/admin/gallery');

    fireEvent.click(await screen.findByRole('button', { name: /new image/i }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/^title/i), {
      target: { value: 'Treatment room' },
    });
    fireEvent.change(within(dialog).getByLabelText(/^category/i), {
      target: { value: 'Clinic spaces' },
    });
    fireEvent.change(within(dialog).getByLabelText(/alternative text/i), {
      target: { value: 'A calm treatment room' },
    });
    fireEvent.change(within(dialog).getByLabelText(/cloudinary public id/i), {
      target: { value: 'blue-miror/gallery/room' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /create item/i }));

    // The title appears in both the media preview label and the card heading.
    expect(await screen.findAllByText('Treatment room')).not.toHaveLength(0);
    expect(state.gallery[0]?.title).toBe('Treatment room');
  });

  it('validates the gallery alternative text', async () => {
    renderAt('/admin/gallery');

    fireEvent.click(await screen.findByRole('button', { name: /new image/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /create item/i }));

    expect(await within(dialog).findByText(/alternative text is required/i)).toBeInTheDocument();
  });

  it('creates a team profile', async () => {
    renderAt('/admin/team');

    fireEvent.click(await screen.findByRole('button', { name: /new profile/i }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/full name/i), {
      target: { value: 'A Practitioner' },
    });
    fireEvent.change(within(dialog).getByLabelText(/role \/ designation/i), {
      target: { value: 'Aesthetic Practitioner' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /create profile/i }));

    expect(await screen.findByText('A Practitioner')).toBeInTheDocument();
  });

  it('requires recorded consent before publishing a testimonial', async () => {
    renderAt('/admin/testimonials');

    fireEvent.click(await screen.findByRole('button', { name: /new testimonial/i }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/client display name/i), {
      target: { value: 'A Client' },
    });
    fireEvent.change(within(dialog).getByRole('textbox', { name: /^testimonial$/i }), {
      target: { value: 'A considered experience.' },
    });
    fireEvent.click(within(dialog).getByLabelText(/publish on the public testimonials page/i));
    fireEvent.click(within(dialog).getByRole('button', { name: /create testimonial/i }));

    expect(
      await within(dialog).findByText(/record when consent was obtained/i),
    ).toBeInTheDocument();
  });

  it('creates an FAQ', async () => {
    renderAt('/admin/faqs');

    fireEvent.click(await screen.findByRole('button', { name: /new faq/i }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/^question/i), {
      target: { value: 'What should I expect?' },
    });
    fireEvent.change(within(dialog).getByLabelText(/^answer/i), {
      target: { value: 'A consultation first.' },
    });
    fireEvent.change(within(dialog).getByLabelText(/^category/i), {
      target: { value: 'Booking' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /create faq/i }));

    expect(await screen.findByText('What should I expect?')).toBeInTheDocument();
  });

  it('saves website settings through the API', async () => {
    const typeSpy = vi.fn();
    globalThis.addEventListener('unhandledrejection', typeSpy);

    const { fetchMock } = renderAt('/admin/settings', { settings: filledSettings });

    const nameInput = await screen.findByLabelText(/clinic \/ website name/i);
    fireEvent.change(nameInput, { target: { value: 'Blue Miror Clinic' } });

    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    expect(await screen.findByText(/website settings saved/i)).toBeInTheDocument();

    const putCall = fetchMock.mock.calls.find(
      ([, init]) => (init as { method?: string } | undefined)?.method === 'PUT',
    );
    expect(putCall).toBeTruthy();

    globalThis.removeEventListener('unhandledrejection', typeSpy);
  });

  it('returns to the login page when the server rejects the session', async () => {
    renderAt('/admin/services', { unauthorized: true });

    expect(
      await screen.findByRole('heading', { name: /^sign in$/i }, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/session was signed out or is no longer valid/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/admin/login');
  });

  it('provides accessible dialog semantics and labelled fields', async () => {
    renderAt('/admin/faqs');

    fireEvent.click(await screen.findByRole('button', { name: /new faq/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByLabelText(/^question/i)).toHaveAttribute('id', 'faq-question');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
