import apiClient from './client';
import { SchemaResponse, ClassSchema } from '../types';

/**
 * Get all classes in the schema
 * @param projectId Optional project_id to filter object counts by. If not provided, uses user's project_id from token.
 */
export const getSchema = async (projectId?: number | 'all' | null): Promise<SchemaResponse> => {
  const params: any = {};
  if (projectId && projectId !== 'all') {
    params.project_id = projectId;
  }
  const response = await apiClient.get<SchemaResponse>('/schema', { params });
  return response.data;
};

/**
 * Get specific class schema
 * @param className The name of the class
 * @param projectId Optional project_id to filter object count by. If not provided, uses user's project_id from token.
 */
export const getClassSchema = async (className: string, projectId?: number | 'all' | null): Promise<ClassSchema> => {
  const params: any = {};
  if (projectId && projectId !== 'all') {
    params.project_id = projectId;
  }
  const response = await apiClient.get<ClassSchema>(`/schema/${className}`, { params });
  return response.data;
};

