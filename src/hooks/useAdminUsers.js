import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient.js';

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => apiClient.getUsers(params),
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => apiClient.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => apiClient.rejectUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
    },
  });
}

export function useDisableUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => apiClient.disableUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
    },
  });
}