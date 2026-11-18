import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  getFaqs,
  getGallery,
  getService,
  getServices,
  getSiteSettings,
  getTeam,
  getTestimonials,
  type ServiceFilters,
} from '@/services/public-content';

const publicRoot = ['public-content'] as const;

// Aligned with the API's 60s public cache so an admin edit becomes visible
// within a minute of the next refetch without hammering the server.
const publicStaleTime = 60 * 1000;

export const publicQueryKeys = {
  settings: [...publicRoot, 'settings'] as const,
  services: (filters: ServiceFilters) =>
    [
      ...publicRoot,
      'services',
      filters.q ?? '',
      filters.category ?? '',
      Boolean(filters.featured),
      filters.limit ?? 24,
    ] as const,
  service: (slug: string) => [...publicRoot, 'service', slug] as const,
  gallery: [...publicRoot, 'gallery'] as const,
  faqs: [...publicRoot, 'faqs'] as const,
  testimonials: [...publicRoot, 'testimonials'] as const,
  team: [...publicRoot, 'team'] as const,
};

export function useSiteSettings() {
  return useQuery({
    queryKey: publicQueryKeys.settings,
    queryFn: getSiteSettings,
    staleTime: publicStaleTime,
  });
}

export function useServices(filters: ServiceFilters = {}) {
  return useQuery({
    queryKey: publicQueryKeys.services(filters),
    queryFn: () => getServices(filters),
    placeholderData: keepPreviousData,
    staleTime: publicStaleTime,
  });
}

export function useService(slug: string) {
  return useQuery({
    queryKey: publicQueryKeys.service(slug),
    queryFn: () => getService(slug),
    enabled: slug.length > 0,
    staleTime: publicStaleTime,
  });
}

export function useGallery() {
  return useQuery({
    queryKey: publicQueryKeys.gallery,
    queryFn: getGallery,
    staleTime: publicStaleTime,
  });
}

export function useFaqs() {
  return useQuery({
    queryKey: publicQueryKeys.faqs,
    queryFn: getFaqs,
    staleTime: publicStaleTime,
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: publicQueryKeys.testimonials,
    queryFn: getTestimonials,
    staleTime: publicStaleTime,
  });
}

export function useTeam() {
  return useQuery({
    queryKey: publicQueryKeys.team,
    queryFn: getTeam,
    staleTime: publicStaleTime,
  });
}
