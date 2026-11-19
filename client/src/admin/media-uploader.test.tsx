import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MediaUploadField } from './components/MediaUploadField';

type Listener = (event: { lengthComputable: boolean; loaded: number; total: number }) => void;

class FakeXhr {
  static instances: FakeXhr[] = [];

  method = '';
  url = '';
  headers: Record<string, string> = {};
  status = 0;
  responseText = '';
  body: FormData | null = null;

  uploadListeners: Listener[] = [];
  loadListeners: Array<() => void> = [];
  errorListeners: Array<() => void> = [];

  upload = {
    addEventListener: (type: string, handler: Listener) => {
      if (type === 'progress') this.uploadListeners.push(handler);
    },
  };

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  addEventListener(type: string, handler: () => void) {
    if (type === 'load') this.loadListeners.push(handler);
    if (type === 'error') this.errorListeners.push(handler);
  }

  send(body: FormData) {
    this.body = body;
    FakeXhr.instances.push(this);
  }

  emitProgress(loaded: number, total: number) {
    this.uploadListeners.forEach((handler) => handler({ lengthComputable: true, loaded, total }));
  }

  respond(status: number, payload: unknown) {
    this.status = status;
    this.responseText = JSON.stringify(payload);
    this.loadListeners.forEach((handler) => handler());
  }
}

function Harness() {
  const [value, setValue] = useState<{ publicId: string; url: string } | null>(null);

  return (
    <div>
      <MediaUploadField
        id="media"
        label="Gallery image"
        folder="gallery"
        publicId={value?.publicId ?? ''}
        onChange={setValue}
      />
      <p data-testid="value">{value?.publicId ?? 'none'}</p>
    </div>
  );
}

function imageFile(name = 'clinic.png', type = 'image/png', size = 1024) {
  const file = new File([new Uint8Array(8)], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('MediaUploadField', () => {
  beforeEach(() => {
    FakeXhr.instances = [];
    vi.stubGlobal('XMLHttpRequest', FakeXhr);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('rejects unsupported file types before uploading', async () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText(/gallery image file/i), {
      target: { files: [imageFile('logo.svg', 'image/svg+xml')] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/JPEG, PNG or WebP/i);
    expect(FakeXhr.instances).toHaveLength(0);
  });

  it('rejects files above the 5 MB limit before uploading', async () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText(/gallery image file/i), {
      target: { files: [imageFile('huge.png', 'image/png', 6 * 1024 * 1024)] },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/5 MB or smaller/i);
    expect(FakeXhr.instances).toHaveLength(0);
  });

  it('uploads a valid image with progress and stores the public ID', async () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText(/gallery image file/i), {
      target: { files: [imageFile()] },
    });

    const xhr = FakeXhr.instances[0];
    expect(xhr).toBeDefined();
    expect(xhr.url).toContain('/admin/uploads');

    xhr.emitProgress(50, 100);
    const progress = await screen.findByRole('progressbar');
    expect((progress as HTMLProgressElement).value).toBe(50);
    expect(screen.getAllByText(/uploading 50%/i).length).toBeGreaterThan(0);

    xhr.respond(201, {
      success: true,
      data: {
        url: 'https://res.cloudinary.com/blue/image/upload/gallery/clinic.png',
        publicId: 'blue-miror/gallery/clinic',
        alt: '',
        width: 800,
        height: 600,
        format: 'png',
        bytes: 1024,
        folder: 'gallery',
      },
    });

    await waitFor(() =>
      expect(screen.getByTestId('value')).toHaveTextContent('blue-miror/gallery/clinic'),
    );
    expect(screen.getByRole('img', { name: /selected image preview/i })).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/blue/image/upload/f_auto,q_auto,w_320/gallery/clinic.png',
    );
  });

  it('reports an upload failure without storing a value', async () => {
    render(<Harness />);

    fireEvent.change(screen.getByLabelText(/gallery image file/i), {
      target: { files: [imageFile()] },
    });

    FakeXhr.instances[0].respond(503, {
      success: false,
      error: { code: 'MEDIA_UNAVAILABLE', message: 'Image uploads are not configured.' },
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/not configured/i);
    expect(screen.getByTestId('value')).toHaveTextContent('none');
  });

  it('deletes a stored asset only after explicit confirmation', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { deleted: true } }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<Harness />);

    fireEvent.change(screen.getByLabelText(/gallery image file/i), {
      target: { files: [imageFile()] },
    });
    FakeXhr.instances[0].respond(201, {
      success: true,
      data: {
        url: 'https://res.cloudinary.com/blue/image/upload/gallery/clinic.png',
        publicId: 'blue-miror/gallery/clinic',
        alt: '',
        width: 1,
        height: 1,
        format: 'png',
        bytes: 1,
        folder: 'gallery',
      },
    });

    fireEvent.click(await screen.findByRole('button', { name: /delete image/i }));
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }));

    await waitFor(() => expect(screen.getByTestId('value')).toHaveTextContent('none'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
