import apiClient from './client';
import { DashboardData } from '../types';

/**
 * Get dashboard overview data
 * @param projectId Optional project_id to filter by. If not provided, uses user's project_id from token.
 */
export const getDashboardOverview = async (projectId?: number | 'all' | null): Promise<DashboardData> => {
  const params: any = {};
  if (projectId && projectId !== 'all') {
    params.project_id = projectId;
  }
  const response = await apiClient.get<DashboardData>('/dashboard/overview', { params });
  return response.data;
};

