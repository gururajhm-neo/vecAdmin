import apiClient from './client';
import { DashboardData } from '../types';

/**
 * Get dashboard overview data
 */
export const getDashboardOverview = async (): Promise<DashboardData> => {
  const response = await apiClient.get<DashboardData>('/dashboard/overview');
  return response.data;
};

