import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '../lib/api'

export function useAuth() {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: api.me,
    retry: false,
    throwOnError: (error) => !(error instanceof ApiError && error.status === 401),
  })

  return {
    user: query.data,
    isLoading: query.isLoading,
    isAuthenticated: query.isSuccess,
  }
}
