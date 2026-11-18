import { describe, expect, it } from 'vitest';

import { testSettings } from '@/test/public-api-mock';

import { buildBookingWhatsAppUrl, buildServiceEnquiryUrl, formatMessageTemplate } from './whatsapp';

const configuredSettings = {
  ...testSettings,
  whatsapp: {
    ...testSettings.whatsapp,
    enabled: true,
    countryCode: '44',
    number: '7700 900123',
    defaultMessage: 'Hello Blue Miror',
    serviceEnquiryTemplate: 'I would like to ask about {service}.',
  },
};

describe('WhatsApp configuration helpers', () => {
  it('does not create a link when WhatsApp is unconfigured', () => {
    expect(buildBookingWhatsAppUrl(testSettings)).toBeNull();
  });

  it('builds a wa.me URL from the central number and default message', () => {
    expect(buildBookingWhatsAppUrl(configuredSettings)).toBe(
      'https://wa.me/447700900123?text=Hello%20Blue%20Miror',
    );
  });

  it('fills the service enquiry template from settings', () => {
    expect(buildServiceEnquiryUrl(configuredSettings, 'Skin consultation')).toBe(
      'https://wa.me/447700900123?text=I%20would%20like%20to%20ask%20about%20Skin%20consultation.',
    );
  });

  it('rejects incomplete or implausible numbers', () => {
    expect(
      buildBookingWhatsAppUrl({
        ...configuredSettings,
        whatsapp: { ...configuredSettings.whatsapp, number: '12' },
      }),
    ).toBeNull();
  });

  it('leaves unknown template placeholders intact', () => {
    expect(formatMessageTemplate('Hello {name}', { name: 'Sam' })).toBe('Hello Sam');
    expect(formatMessageTemplate('Hello {unknown}', {})).toBe('Hello {unknown}');
    expect(formatMessageTemplate(null)).toBeNull();
  });
});
