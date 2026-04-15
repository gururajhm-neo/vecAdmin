/**
 * Mock domain definitions for Demo / Mock Mode.
 * Each domain is a self-contained dataset with schema + stats.
 * The selected domain is persisted in localStorage so it survives page refresh.
 */

export type DomainKey = 'ecommerce' | 'healthcare' | 'media' | 'iot';

export interface MockProperty {
  name: string;
  dataType: string[];
  description?: string;
}

export interface MockClass {
  name: string;
  description?: string;
  objectCount: number;
  vectorizer?: string;
  properties: MockProperty[];
}

export interface MockDomain {
  key: DomainKey;
  name: string;
  icon: string;
  tagline: string;
  color: string;
  hostname: string;
  version: string;
  memory: { used: number; total: number; percent: number };
  classes: MockClass[];
}

export const MOCK_DOMAIN_KEY = 'weaviate_mock_domain';
export const getCurrentDomain = (): DomainKey =>
  (localStorage.getItem(MOCK_DOMAIN_KEY) as DomainKey) || 'ecommerce';
export const setDomain = (key: DomainKey) =>
  localStorage.setItem(MOCK_DOMAIN_KEY, key);

// ─── Domain Datasets ──────────────────────────────────────────────────────────

export const DOMAINS: Record<DomainKey, MockDomain> = {

  // ── E-Commerce ──────────────────────────────────────────────────────────────
  ecommerce: {
    key: 'ecommerce',
    name: 'E-Commerce',
    icon: '🛍️',
    tagline: 'Products, orders, customers & reviews',
    color: '#4CAF50',
    hostname: 'weaviate-ecommerce-prod.internal',
    version: '1.24.1',
    memory: { used: 6.8, total: 16, percent: 42 },
    classes: [
      {
        name: 'Product',
        description: 'Catalogue items available for purchase',
        objectCount: 14523,
        vectorizer: 'text2vec-openai',
        properties: [
          { name: 'name', dataType: ['text'] },
          { name: 'description', dataType: ['text'] },
          { name: 'price', dataType: ['number'] },
          { name: 'category', dataType: ['text'] },
          { name: 'brand', dataType: ['text'] },
          { name: 'sku', dataType: ['text'] },
          { name: 'inStock', dataType: ['boolean'] },
          { name: 'rating', dataType: ['number'] },
          { name: 'reviewCount', dataType: ['int'] },
        ],
      },
      {
        name: 'Order',
        description: 'Customer purchase transactions',
        objectCount: 87234,
        properties: [
          { name: 'orderNumber', dataType: ['text'] },
          { name: 'status', dataType: ['text'] },
          { name: 'totalAmount', dataType: ['number'] },
          { name: 'itemCount', dataType: ['int'] },
          { name: 'customerId', dataType: ['text'] },
          { name: 'createdAt', dataType: ['date'] },
          { name: 'shippedAt', dataType: ['date'] },
          { name: 'trackingNumber', dataType: ['text'] },
        ],
      },
      {
        name: 'Customer',
        description: 'Registered buyers and their profiles',
        objectCount: 32891,
        vectorizer: 'text2vec-openai',
        properties: [
          { name: 'firstName', dataType: ['text'] },
          { name: 'lastName', dataType: ['text'] },
          { name: 'email', dataType: ['text'] },
          { name: 'city', dataType: ['text'] },
          { name: 'country', dataType: ['text'] },
          { name: 'registeredAt', dataType: ['date'] },
          { name: 'tier', dataType: ['text'] },
          { name: 'totalOrders', dataType: ['int'] },
          { name: 'lifetimeValue', dataType: ['number'] },
        ],
      },
      {
        name: 'Review',
        description: 'Product reviews and ratings from customers',
        objectCount: 156432,
        vectorizer: 'text2vec-openai',
        properties: [
          { name: 'productId', dataType: ['text'] },
          { name: 'customerId', dataType: ['text'] },
          { name: 'rating', dataType: ['int'] },
          { name: 'title', dataType: ['text'] },
          { name: 'body', dataType: ['text'] },
          { name: 'helpful', dataType: ['int'] },
          { name: 'verified', dataType: ['boolean'] },
          { name: 'createdAt', dataType: ['date'] },
        ],
      },
      {
        name: 'Category',
        description: 'Product category taxonomy',
        objectCount: 248,
        properties: [
          { name: 'name', dataType: ['text'] },
          { name: 'slug', dataType: ['text'] },
          { name: 'description', dataType: ['text'] },
          { name: 'parentCategory', dataType: ['text'] },
          { name: 'productCount', dataType: ['int'] },
          { name: 'featured', dataType: ['boolean'] },
        ],
      },
    ],
  },

  // ── Healthcare ──────────────────────────────────────────────────────────────
  healthcare: {
    key: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    tagline: 'Patients, appointments & medical records',
    color: '#2196F3',
    hostname: 'weaviate-health-eu.internal',
    version: '1.23.7',
    memory: { used: 11.2, total: 32, percent: 35 },
    classes: [
      {
        name: 'Patient',
        description: 'Registered patients and their demographics',
        objectCount: 8743,
        vectorizer: 'text2vec-transformers',
        properties: [
          { name: 'firstName', dataType: ['text'] },
          { name: 'lastName', dataType: ['text'] },
          { name: 'dateOfBirth', dataType: ['date'] },
          { name: 'bloodType', dataType: ['text'] },
          { name: 'allergies', dataType: ['text'] },
          { name: 'primaryDoctorId', dataType: ['text'] },
          { name: 'insuranceId', dataType: ['text'] },
          { name: 'emergencyContact', dataType: ['text'] },
        ],
      },
      {
        name: 'Doctor',
        description: 'Registered physicians and specialists',
        objectCount: 421,
        vectorizer: 'text2vec-transformers',
        properties: [
          { name: 'name', dataType: ['text'] },
          { name: 'specialty', dataType: ['text'] },
          { name: 'department', dataType: ['text'] },
          { name: 'licenseNumber', dataType: ['text'] },
          { name: 'yearsExperience', dataType: ['int'] },
          { name: 'available', dataType: ['boolean'] },
          { name: 'hospital', dataType: ['text'] },
        ],
      },
      {
        name: 'Appointment',
        description: 'Scheduled patient-doctor consultations',
        objectCount: 23156,
        properties: [
          { name: 'patientId', dataType: ['text'] },
          { name: 'doctorId', dataType: ['text'] },
          { name: 'scheduledAt', dataType: ['date'] },
          { name: 'status', dataType: ['text'] },
          { name: 'reason', dataType: ['text'] },
          { name: 'durationMinutes', dataType: ['int'] },
          { name: 'notes', dataType: ['text'] },
        ],
      },
      {
        name: 'MedicalRecord',
        description: 'Clinical visit records and diagnoses',
        objectCount: 34521,
        vectorizer: 'text2vec-transformers',
        properties: [
          { name: 'patientId', dataType: ['text'] },
          { name: 'doctorId', dataType: ['text'] },
          { name: 'visitDate', dataType: ['date'] },
          { name: 'diagnosis', dataType: ['text'] },
          { name: 'treatment', dataType: ['text'] },
          { name: 'prescription', dataType: ['text'] },
          { name: 'followUpDays', dataType: ['int'] },
        ],
      },
      {
        name: 'Medication',
        description: 'Drug formulary and dosage information',
        objectCount: 1876,
        vectorizer: 'text2vec-transformers',
        properties: [
          { name: 'brandName', dataType: ['text'] },
          { name: 'genericName', dataType: ['text'] },
          { name: 'dosageForm', dataType: ['text'] },
          { name: 'strength', dataType: ['text'] },
          { name: 'manufacturer', dataType: ['text'] },
          { name: 'controlled', dataType: ['boolean'] },
          { name: 'indications', dataType: ['text'] },
        ],
      },
    ],
  },

  // ── Media / Blog ─────────────────────────────────────────────────────────────
  media: {
    key: 'media',
    name: 'Media & Blog',
    icon: '📰',
    tagline: 'Articles, authors, tags & comments',
    color: '#9C27B0',
    hostname: 'weaviate-media-us.internal',
    version: '1.24.0',
    memory: { used: 4.1, total: 8, percent: 51 },
    classes: [
      {
        name: 'Article',
        description: 'Published editorial content',
        objectCount: 12834,
        vectorizer: 'text2vec-openai',
        properties: [
          { name: 'title', dataType: ['text'] },
          { name: 'slug', dataType: ['text'] },
          { name: 'summary', dataType: ['text'] },
          { name: 'content', dataType: ['text'] },
          { name: 'authorId', dataType: ['text'] },
          { name: 'publishedAt', dataType: ['date'] },
          { name: 'readingTimeMin', dataType: ['int'] },
          { name: 'viewCount', dataType: ['int'] },
          { name: 'featured', dataType: ['boolean'] },
        ],
      },
      {
        name: 'Author',
        description: 'Content creators and contributors',
        objectCount: 234,
        vectorizer: 'text2vec-openai',
        properties: [
          { name: 'displayName', dataType: ['text'] },
          { name: 'email', dataType: ['text'] },
          { name: 'bio', dataType: ['text'] },
          { name: 'articlesPublished', dataType: ['int'] },
          { name: 'followers', dataType: ['int'] },
          { name: 'specialty', dataType: ['text'] },
          { name: 'verified', dataType: ['boolean'] },
        ],
      },
      {
        name: 'Tag',
        description: 'Content taxonomy labels',
        objectCount: 187,
        properties: [
          { name: 'name', dataType: ['text'] },
          { name: 'slug', dataType: ['text'] },
          { name: 'articleCount', dataType: ['int'] },
          { name: 'color', dataType: ['text'] },
          { name: 'trending', dataType: ['boolean'] },
        ],
      },
      {
        name: 'Comment',
        description: 'Reader responses on articles',
        objectCount: 89432,
        vectorizer: 'text2vec-openai',
        properties: [
          { name: 'articleId', dataType: ['text'] },
          { name: 'authorName', dataType: ['text'] },
          { name: 'content', dataType: ['text'] },
          { name: 'createdAt', dataType: ['date'] },
          { name: 'likes', dataType: ['int'] },
          { name: 'approved', dataType: ['boolean'] },
          { name: 'parentCommentId', dataType: ['text'] },
        ],
      },
      {
        name: 'Newsletter',
        description: 'Email subscriber list and preferences',
        objectCount: 45123,
        properties: [
          { name: 'email', dataType: ['text'] },
          { name: 'subscribedAt', dataType: ['date'] },
          { name: 'preferences', dataType: ['text'] },
          { name: 'status', dataType: ['text'] },
          { name: 'lastEmailSentAt', dataType: ['date'] },
          { name: 'openRate', dataType: ['number'] },
        ],
      },
    ],
  },

  // ── IoT / Sensors ─────────────────────────────────────────────────────────────
  iot: {
    key: 'iot',
    name: 'IoT / Sensors',
    icon: '🔌',
    tagline: 'Devices, readings, alerts & locations',
    color: '#FF5722',
    hostname: 'weaviate-iot-edge.internal',
    version: '1.23.9',
    memory: { used: 18.4, total: 64, percent: 29 },
    classes: [
      {
        name: 'Device',
        description: 'Registered IoT hardware endpoints',
        objectCount: 3241,
        vectorizer: 'text2vec-transformers',
        properties: [
          { name: 'name', dataType: ['text'] },
          { name: 'type', dataType: ['text'] },
          { name: 'locationId', dataType: ['text'] },
          { name: 'status', dataType: ['text'] },
          { name: 'firmware', dataType: ['text'] },
          { name: 'batteryPercent', dataType: ['int'] },
          { name: 'lastSeen', dataType: ['date'] },
          { name: 'manufacturer', dataType: ['text'] },
        ],
      },
      {
        name: 'SensorReading',
        description: 'Time-series telemetry from devices',
        objectCount: 2456789,
        properties: [
          { name: 'deviceId', dataType: ['text'] },
          { name: 'temperature', dataType: ['number'] },
          { name: 'humidity', dataType: ['number'] },
          { name: 'pressure', dataType: ['number'] },
          { name: 'co2Ppm', dataType: ['int'] },
          { name: 'timestamp', dataType: ['date'] },
          { name: 'quality', dataType: ['text'] },
        ],
      },
      {
        name: 'Alert',
        description: 'Triggered threshold and anomaly notifications',
        objectCount: 14523,
        vectorizer: 'text2vec-transformers',
        properties: [
          { name: 'deviceId', dataType: ['text'] },
          { name: 'severity', dataType: ['text'] },
          { name: 'alertType', dataType: ['text'] },
          { name: 'message', dataType: ['text'] },
          { name: 'triggeredAt', dataType: ['date'] },
          { name: 'resolved', dataType: ['boolean'] },
          { name: 'acknowledgedBy', dataType: ['text'] },
        ],
      },
      {
        name: 'Location',
        description: 'Physical spaces where devices are deployed',
        objectCount: 523,
        properties: [
          { name: 'name', dataType: ['text'] },
          { name: 'building', dataType: ['text'] },
          { name: 'floor', dataType: ['int'] },
          { name: 'room', dataType: ['text'] },
          { name: 'areaM2', dataType: ['number'] },
          { name: 'deviceCount', dataType: ['int'] },
        ],
      },
      {
        name: 'MaintenanceLog',
        description: 'Device service and repair history',
        objectCount: 8934,
        properties: [
          { name: 'deviceId', dataType: ['text'] },
          { name: 'maintenanceType', dataType: ['text'] },
          { name: 'technician', dataType: ['text'] },
          { name: 'scheduledAt', dataType: ['date'] },
          { name: 'completedAt', dataType: ['date'] },
          { name: 'notes', dataType: ['text'] },
          { name: 'costUsd', dataType: ['number'] },
        ],
      },
    ],
  },
};
