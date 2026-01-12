import apiClient from './client';
import { QueryRequest, QueryResponse } from '../types';

/**
 * Execute GraphQL query
 */
export const executeQuery = async (query: string): Promise<QueryResponse> => {
  const response = await apiClient.post<QueryResponse>('/query/execute', {
    query,
  } as QueryRequest);
  return response.data;
};

