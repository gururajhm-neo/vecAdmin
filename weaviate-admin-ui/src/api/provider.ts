import apiClient from './client';

export interface ProviderInfo {
  provider: string;
  query_language: 'graphql' | 'json';
  ready: boolean;
  capabilities: {
    vector_search: boolean;
    filters: boolean;
    full_text_search: boolean;
    graphql: boolean;
    aggregate: boolean;
  };
}

export async function getProviderInfo(): Promise<ProviderInfo> {
  const response = await apiClient.get<ProviderInfo>('/provider/info');
  return response.data;
}
