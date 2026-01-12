import apiClient from './client';
import { ObjectListResponse, SimilarObjectsResponse } from '../types';

/**
 * Get objects from a class with pagination
 */
export const getObjects = async (
  className: string,
  limit: number = 50,
  offset: number = 0,
  search?: string
): Promise<ObjectListResponse> => {
  const params: any = { limit, offset };
  if (search) {
    params.search = search;
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

