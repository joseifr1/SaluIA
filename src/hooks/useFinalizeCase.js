import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient.js';

export function useFinalizeCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, data }) => apiClient.finalizeCase(caseId, data),
    onSuccess: (data, { caseId }) => {
      queryClient.invalidateQueries(['record', caseId]);
      queryClient.invalidateQueries(['records']);
    },
  });
}