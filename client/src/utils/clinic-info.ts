type ClinicHour = { label: string; value: string };

/** Turns a weekly hours list into a short, human label. */
export function formatHoursLabel(hours: ClinicHour[] | null | undefined): string | null {
  if (!hours || hours.length === 0) return null;

  const first = hours[0]?.value;
  if (!first) return null;

  const sameEveryDay = hours.length > 1 && hours.every((entry) => entry.value === first);

  return sameEveryDay ? `Daily ${first}` : `${hours[0]?.label} ${first}`;
}

/** `tel:` link that survives spaces, brackets and dashes in the display number. */
export function phoneHref(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.length > 3 ? `tel:${cleaned}` : null;
}

/** First meaningful line of an address, for tight spaces. */
export function shortAddress(address: string | null | undefined): string | null {
  if (!address) return null;

  const first = address
    .split(',')
    .map((part) => part.trim())
    .find(Boolean);

  return first ?? null;
}
