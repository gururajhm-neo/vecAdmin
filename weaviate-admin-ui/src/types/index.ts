// User and Authentication Types
export interface User {
  email: string;
  name: string;
  project_id?: number;  // Customer/Project identifier
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Dashboard Types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  uptime?: string;
  last_checked?: string;
}

export interface MemoryUsage {
  used: number;
  total: number;
  percent: number;
}

export interface DashboardData {
  health: HealthStatus;
  memory?: MemoryUsage;
  object_counts: Record<string, number>;
  total_objects: number;
  version?: string;
  hostname?: string;
  project_id?: number;  // Current user's project ID
}

// Schema Types
export interface Property {
  name: string;
  dataType: string[];
  indexed?: boolean;
  description?: string;
}

export interface VectorConfig {
  vectorizer?: string;
  vectorIndexConfig?: any;
  moduleConfig?: any;
}

export interface ClassSchema {
  name: string;
  description?: string;
  properties: Property[];
  vectorConfig?: VectorConfig;
  objectCount?: number;
}

export interface SchemaResponse {
  classes: ClassSchema[];
}

// Data Browser Types
export interface WeaviateObject {
  [key: string]: any;
  _additional?: {
    id: string;
    creationTimeUnix?: number;
    distance?: number;
  };
}

export interface ObjectListResponse {
  objects: WeaviateObject[];
  total: number;
  limit: number;
  offset: number;
}

export interface SimilarObjectsResponse {
  similar_objects: WeaviateObject[];
}

// Query Types
export interface QueryRequest {
  query: string;
}

export interface QueryResponse {
  data?: any;
  error?: string;
  execution_time_ms?: number;
}

// Example Query Type
export interface ExampleQuery {
  id: string;
  name: string;
  description: string;
  query: string;
}

