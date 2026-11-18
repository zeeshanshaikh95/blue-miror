import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Accordion } from './Accordion';

const items = [
  { id: 'one', question: 'What happens first?', answer: 'A private conversation.' },
  { id: 'two', question: 'Is this advice?', answer: 'No, it is general information.' },
];

describe('Accordion', () => {
  afterEach(cleanup);

  it('opens and closes an accessible FAQ panel', () => {
    render(<Accordion items={items} />);

    const button = screen.getByRole('button', { name: 'What happens first?' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('A private conversation.')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'What happens first?' })).toHaveTextContent(
      'A private conversation.',
    );

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('A private conversation.')).not.toBeInTheDocument();
  });
});
