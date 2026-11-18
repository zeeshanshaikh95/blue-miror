import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from '@/app/App';
import { AppProviders } from '@/app/providers';
import { queryClient } from '@/lib/query-client';
import { mockPublicApi } from '@/test/public-api-mock';

function renderTreatments() {
  window.history.pushState({}, '', '/treatments');
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}

describe('TreatmentsPage', () => {
  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.unstubAllGlobals();
  });

  it('filters API-driven treatments through the search field', async () => {
    mockPublicApi();
    renderTreatments();

    // First paint renders the whole app shell, so allow more than the 1s query default.
    expect(
      await screen.findByRole('heading', { name: 'Skin consultation' }, { timeout: 3_000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Facial treatment' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search treatments'), {
      target: { value: 'facial' },
    });

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Skin consultation' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Facial treatment' })).toBeInTheDocument();
    expect(await screen.findByText('1 treatment')).toBeInTheDocument();
  });

  it('filters by category and exposes pressed state', async () => {
    mockPublicApi();
    renderTreatments();

    await screen.findByRole('heading', { name: 'Facial treatment' }, { timeout: 3_000 });
    fireEvent.click(screen.getByRole('button', { name: 'Skin' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Facial treatment' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Skin' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Skin treatment' })).toBeInTheDocument();
  });

  it('shows a loading skeleton while treatments are pending', async () => {
    mockPublicApi({ servicesPending: true });
    renderTreatments();

    expect(await screen.findByRole('status', { name: 'Loading treatments' })).toBeInTheDocument();
  });

  it('shows a recoverable error state when treatments fail', async () => {
    mockPublicApi({ servicesError: true });
    renderTreatments();

    expect(await screen.findByRole('alert', {}, { timeout: 3_000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
