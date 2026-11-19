import { describe, expect, it } from 'vitest';

import { previewImageUrl } from './cloudinary-image';

describe('previewImageUrl', () => {
  it('adds a bounded transformation to a Cloudinary delivery URL', () => {
    expect(
      previewImageUrl('https://res.cloudinary.com/demo/image/upload/blue-miror/gallery/room.jpg', 480),
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_480/blue-miror/gallery/room.jpg',
    );
  });

  it('replaces an existing transformation instead of stacking them', () => {
    expect(
      previewImageUrl(
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_900/blue-miror/team/portrait.jpg',
        320,
      ),
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_320/blue-miror/team/portrait.jpg',
    );
  });

  it('leaves non-Cloudinary URLs untouched', () => {
    expect(previewImageUrl('https://example.com/photo.jpg', 400)).toBe(
      'https://example.com/photo.jpg',
    );
  });

  it('returns null for empty values', () => {
    expect(previewImageUrl(null)).toBeNull();
    expect(previewImageUrl('  ')).toBeNull();
  });
});
