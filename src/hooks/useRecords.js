import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient.js';

export function useRecords(params = {}) {
  return useQuery({
    queryKey: ['records', params],
    queryFn: () => apiClient.getRecords(params),
  });
}

export function useRecord(id) {
  return useQuery({
    queryKey: ['record', id],
    queryFn: () => apiClient.getRecord(id),
    enabled: !!id,
  });
}