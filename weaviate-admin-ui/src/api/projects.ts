import apiClient from './client';

export interface ProjectMetadata {
  id: number;
  name: string;
  org_id?: number | null;
}

export interface AvailableProjectsResponse {
  projects: number[];  // For backward compatibility
  projects_with_metadata?: ProjectMetadata[];  // New: includes project names
  total_projects: number;
  error?: string;
}

/**
 * Get list of all available project_ids in Weaviate
 */
export const getAvailableProjects = async (): Promise<AvailableProjectsResponse> => {
  const response = await apiClient.get<AvailableProjectsResponse>('/projects/available');
  return response.data;
};

