import apiClient from './client';
import { SchemaResponse, ClassSchema } from '../types';

/**
 * Get all classes in the schema
 */
export const getSchema = async (): Promise<SchemaResponse> => {
  const response = await apiClient.get<SchemaResponse>('/schema');
  return response.data;
};

/**
 * Get specific class schema
 */
export const getClassSchema = async (className: string): Promise<ClassSchema> => {
  const response = await apiClient.get<ClassSchema>(`/schema/${className}`);
  return response.data;
};

