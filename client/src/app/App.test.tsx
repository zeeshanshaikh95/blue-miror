import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { queryClient } from '@/lib/query-client';
import { mockPublicApi } from '@/test/public-api-mock';

import { App } from './App';
import { AppProviders } from './providers';

function renderAt(path: string) {
  window.history.pushState({}, '', path);
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}

describe('public routes', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it('renders the homepage with API-driven featured treatments', async () => {
    mockPublicApi();
    renderAt('/');

    expect(
      await screen.findByRole(
        'heading',
        {
          level: 1,
          name: /considered care, guided by conversation/i,
        },
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByAltText('Blue Miror crest and wordmark').length).toBeGreaterThan(0);
    expect(
      await screen.findByRole('heading', { name: 'Skin consultation' }, { timeout: 3_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view all treatments/i })).toHaveAttribute(
      'href',
      '/treatments',
    );
  });

  it('renders a dynamic treatment detail page from the content API', async () => {
    mockPublicApi();
    renderAt('/treatments/skin-consultation');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Skin consultation' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Draft content')).toBeInTheDocument();
    expect(screen.getByText('Sample treatment overview.')).toBeInTheDocument();
    expect(screen.getByText('Suitability and risks require a consultation.')).toBeInTheDocument();
  });

  it('shows a designed not-found state for an unknown treatment', async () => {
    mockPublicApi();
    renderAt('/treatments/not-a-treatment');

    expect(
      await screen.findByRole(
        'heading',
        { name: /this treatment is not available/i },
        { timeout: 3_000 },
      ),
    ).toBeInTheDocument();
  });

  it('opens and closes the mobile navigation disclosure', async () => {
    mockPublicApi();
    renderAt('/');

    const openButton = await screen.findByRole('button', { name: 'Open navigation' });
    fireEvent.click(openButton);

    expect(openButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Mobile primary' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'Mobile primary' })).not.toBeInTheDocument();
  });

  it('renders the public 404 route', async () => {
    mockPublicApi();
    renderAt('/does-not-exist');

    expect(
      await screen.findByRole('heading', { name: /this page has moved on/i }),
    ).toBeInTheDocument();
  });
});
