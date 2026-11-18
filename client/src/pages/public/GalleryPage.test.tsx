import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';
import { mockPublicApi } from '@/test/public-api-mock';

describe('GalleryPage', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it('filters placeholder images by category', async () => {
    mockPublicApi();
    window.history.pushState({}, '', '/gallery');
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(await screen.findByText('Reception study')).toBeInTheDocument();
    expect(screen.getByText('Material detail')).toBeInTheDocument();
    expect(screen.getAllByText('Image placeholder').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Details' }));

    await waitFor(() => {
      expect(screen.queryByText('Reception study')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Material detail')).toBeInTheDocument();
    expect(screen.getByText(/This section is deliberately absent/i)).toBeInTheDocument();
  });
});
