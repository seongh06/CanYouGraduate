import { apiFetch } from './client';

export interface CatalogSearchResult {
  catalogCourseId: number;
  name: string;
  code: string;
  category: string;
  similarity: number;
}

export function searchCatalogCourses(sessionId: string, query: string, limit = 5) {
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  params.set('limit', String(limit));
  return apiFetch<{ results: CatalogSearchResult[] }>(`/api/catalog/courses?${params.toString()}`, { sessionId });
}
