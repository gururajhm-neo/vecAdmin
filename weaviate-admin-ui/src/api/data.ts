import apiClient from './client';
import { ObjectListResponse, SimilarObjectsResponse } from '../types';

/**
 * Get objects from a class with pagination and optional search
 */
export const getObjects = async (
  className: string,
  limit: number = 50,
  offset: number = 0,
  search?: string,
  projectId?: number | 'all' | null
): Promise<ObjectListResponse> => {
  const params: any = { limit, offset };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (projectId && projectId !== 'all') {
    params.project_id = projectId;
  }
  
  const response = await apiClient.get<ObjectListResponse>(
    `/data/${className}/objects`,
    { params }
  );
  return response.data;
};

/**
 * Get object details by ID
 */
export const getObjectDetail = async (
  className: string,
  objectId: string
): Promise<any> => {
  const response = await apiClient.get(`/data/${className}/objects/${objectId}`);
  return response.data;
};

/**
 * Find similar objects
 */
export const findSimilarObjects = async (
  className: string,
  objectId: string,
  limit: number = 5
): Promise<SimilarObjectsResponse> => {
  const response = await apiClient.post<SimilarObjectsResponse>(
    `/data/${className}/similar`,
    { object_id: objectId, limit }
  );
  return response.data;
};

