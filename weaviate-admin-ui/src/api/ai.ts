import apiClient from './client';

export interface NLQueryResponse {
  query?: string;
  error?: string;
  provider?: string;
  query_language?: string;
}

export interface ExplainResponse {
  explanation?: string;
  error?: string;
}

export interface AIStatusResponse {
  available: boolean;
  provider?: string;
  model?: string;
}

/**
 * Convert a natural language request into a provider-native query.
 * Passes the cached schema so the model uses real collection/field names.
 */
export const nlToQuery = async (
  naturalLanguage: string,
  schemaClasses: any[] = [],
): Promise<NLQueryResponse> => {
  const response = await apiClient.post<NLQueryResponse>('/ai/nl-to-query', {
    natural_language: naturalLanguage,
    schema_classes: schemaClasses,
  });
  return response.data;
};

/**
 * Explain query results in plain English.
 */
export const explainResults = async (
  query: string,
  results: any,
): Promise<ExplainResponse> => {
  const response = await apiClient.post<ExplainResponse>('/ai/explain', {
    query,
    results,
  });
  return response.data;
};

/**
 * Check if AI features are configured and available.
 */
export const getAIStatus = async (): Promise<AIStatusResponse> => {
  const response = await apiClient.get<AIStatusResponse>('/ai/status');
  return response.data;
};
