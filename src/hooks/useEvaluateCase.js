import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient.js';

export function useEvaluateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseId) => apiClient.evaluateCase(caseId),
    onSuccess: (data, caseId) => {
      queryClient.invalidateQueries(['record', caseId]);
      queryClient.invalidateQueries(['records']);
    },
  });
}