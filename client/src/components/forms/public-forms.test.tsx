import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BookingForm, ContactForm, TestimonialForm } from '@/components/forms/PublicForms';

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

function stubFetch(handler: (url: string, init?: RequestInit) => ReturnType<typeof jsonResponse>) {
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return handler(url, init);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const futureDate = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

function fillBooking() {
  fireEvent.change(screen.getByLabelText(/^Full name/i), { target: { value: 'Ayesha Khan' } });
  fireEvent.change(screen.getByLabelText(/^Phone/i), { target: { value: '07700900123' } });
  fireEvent.change(screen.getByLabelText(/^Preferred date/i), {
    target: { value: futureDate() },
  });
  fireEvent.change(screen.getByLabelText(/^Preferred time/i), { target: { value: '14:30' } });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('BookingForm', () => {
  it('requires consent before sending and never calls the API', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ success: true, data: {} }, 201));
    render(<BookingForm serviceName="Skin consultation" serviceSlug="skin-consultation" />);

    fillBooking();
    fireEvent.click(screen.getByRole('button', { name: /Send request/i }));

    expect(await screen.findByText(/Please confirm the consent statement/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the request and shows the clinic reference with the WhatsApp handoff', async () => {
    let body: Record<string, unknown> = {};
    const fetchMock = stubFetch((_url, init) => {
      body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
      return jsonResponse(
        {
          success: true,
          data: {
            reference: 'BM-261120-AB12',
            status: 'pending',
            whatsappUrl: 'https://wa.me/447700900123?text=Booking',
            serviceName: 'Skin consultation',
          },
        },
        201,
      );
    });

    render(<BookingForm serviceName="Skin consultation" serviceSlug="skin-consultation" />);

    fillBooking();
    fireEvent.click(screen.getByLabelText(/privacy notice/i));
    fireEvent.click(screen.getByRole('button', { name: /Send request/i }));

    expect(await screen.findByText('BM-261120-AB12')).toBeInTheDocument();
    expect(screen.getByText(/reviews every request before it is confirmed/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue on WhatsApp/i })).toHaveAttribute(
      'href',
      'https://wa.me/447700900123?text=Booking',
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body.consentAccepted).toBe(true);
    expect(body.serviceSlug).toBe('skin-consultation');
    expect(body.preferredTime).toBe('14:30');
    expect(typeof body.formStartedAt).toBe('number');
    expect(body.company).toBe('');
  });

  it('shows the server message when a duplicate request is rejected', async () => {
    stubFetch(() =>
      jsonResponse(
        {
          success: false,
          error: {
            code: 'DUPLICATE_REQUEST',
            message: 'A request from this number was just received.',
          },
        },
        409,
      ),
    );

    render(<BookingForm />);
    fillBooking();
    fireEvent.click(screen.getByLabelText(/privacy notice/i));
    fireEvent.click(screen.getByRole('button', { name: /Send request/i }));

    expect(
      await screen.findByText(/A request from this number was just received/i),
    ).toBeInTheDocument();
  });

  it('maps server field errors back onto the form', async () => {
    stubFetch(() =>
      jsonResponse(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please check the highlighted fields.',
            fields: { preferredTime: 'Choose a preferred time in 24-hour form.' },
          },
        },
        422,
      ),
    );

    render(<BookingForm />);
    fillBooking();
    fireEvent.click(screen.getByLabelText(/privacy notice/i));
    fireEvent.click(screen.getByRole('button', { name: /Send request/i }));

    expect(await screen.findByText(/Choose a preferred time in 24-hour form/i)).toBeInTheDocument();
  });
});

describe('ContactForm', () => {
  it('sends a message and confirms it was received', async () => {
    stubFetch(() =>
      jsonResponse({ success: true, data: { reference: 'contact-1', status: 'new' } }, 201),
    );

    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/^Name/i), { target: { value: 'Nadia Rehman' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'nadia@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Subject/i), { target: { value: 'Opening hours' } });
    fireEvent.change(screen.getByLabelText(/^Message/i), {
      target: { value: 'Could you confirm your weekend opening hours please?' },
    });
    fireEvent.click(screen.getByLabelText(/privacy notice/i));
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));

    expect(await screen.findByText('contact-1')).toBeInTheDocument();
    expect(screen.getByText(/will reply to the email address you provided/i)).toBeInTheDocument();
  });

  it('validates the email format before sending', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ success: true, data: {} }, 201));
    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/^Name/i), { target: { value: 'Nadia Rehman' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/^Subject/i), { target: { value: 'Hours' } });
    fireEvent.change(screen.getByLabelText(/^Message/i), {
      target: { value: 'Could you confirm your weekend hours please?' },
    });
    fireEvent.click(screen.getByLabelText(/privacy notice/i));
    fireEvent.click(screen.getByRole('button', { name: /Send message/i }));

    expect(await screen.findByText(/Use a valid email address/i)).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
  });
});

describe('TestimonialForm', () => {
  it('submits a consented story for moderation', async () => {
    stubFetch(() =>
      jsonResponse({ success: true, data: { reference: 'story-1', status: 'pending' } }, 201),
    );

    render(<TestimonialForm />);

    fireEvent.change(screen.getByLabelText(/^Name to display/i), {
      target: { value: 'Hana Y.' },
    });
    fireEvent.change(screen.getByLabelText(/^Your experience/i), {
      target: {
        value: 'The consultation was calm, clear and genuinely unhurried from start to finish.',
      },
    });
    fireEvent.click(screen.getByLabelText(/This is my own experience/i));
    fireEvent.click(screen.getByRole('button', { name: /Submit for review/i }));

    expect(await screen.findByText('story-1')).toBeInTheDocument();
    expect(
      screen.getByText(/reviewed by the clinic before anything is published/i),
    ).toBeInTheDocument();
  });

  it('rejects a story that is too short', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ success: true, data: {} }, 201));
    render(<TestimonialForm />);

    fireEvent.change(screen.getByLabelText(/^Name to display/i), { target: { value: 'Hana Y.' } });
    fireEvent.change(screen.getByLabelText(/^Your experience/i), { target: { value: 'Lovely.' } });
    fireEvent.click(screen.getByLabelText(/This is my own experience/i));
    fireEvent.click(screen.getByRole('button', { name: /Submit for review/i }));

    expect(await screen.findByText(/Please write at least 20 characters/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
