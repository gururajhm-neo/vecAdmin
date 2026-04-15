/**
 * Mock Axios adapter.
 * Intercepts all apiClient requests when REACT_APP_MOCK_MODE=true and returns
 * domain-specific synthetic data — no network calls made at all.
 *
 * Usage: set adapter on the axios instance in client.ts.
 */
import { getCurrentDomain, DOMAINS, DomainKey } from './domains';

// ── Helpers ───────────────────────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function fakeId(index: number): string {
  return `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function pick<T>(arr: T[], index: number): T {
  return arr[Math.abs(index) % arr.length];
}

/** Produce a stable mock AxiosResponse-shaped object */
function ok(config: any, data: any) {
  return { data, status: 200, statusText: 'OK', headers: {}, config, request: {} };
}

// ── Object factory — generates per-domain, per-class realistic properties ─────

const ECOMMERCE_PRODUCTS = ['Wireless Headphones', 'Running Shoes', 'Coffee Maker', 'Yoga Mat', 'Smart Watch', 'Desk Lamp', 'Backpack', 'Sunglasses', 'Bluetooth Speaker', 'Mechanical Keyboard'];
const ECOMMERCE_BRANDS = ['TechPro', 'Nimbus', 'Auro', 'Stellar', 'Vanta', 'Crestline', 'Forge', 'Nova', 'Apix', 'Zentri'];
const ECOMMERCE_CATEGORIES = ['Electronics', 'Apparel', 'Sports', 'Home & Kitchen', 'Health', 'Books', 'Toys', 'Outdoor', 'Beauty', 'Automotive'];
const ECOMMERCE_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const ECOMMERCE_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum'];
const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 'Karen', 'Leo', 'Maya', 'Nate', 'Olivia'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore'];
const CITIES = ['New York', 'London', 'Berlin', 'Tokyo', 'Sydney', 'Toronto', 'Paris', 'Singapore', 'Mumbai', 'Cape Town'];
const COUNTRIES = ['US', 'UK', 'DE', 'JP', 'AU', 'CA', 'FR', 'SG', 'IN', 'ZA'];

const DOCTOR_SPECIALTIES = ['Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Emergency Medicine'];
const DEPARTMENTS = ['Inpatient', 'Outpatient', 'ICU', 'Emergency', 'Surgery', 'Radiology'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const APPT_STATUSES = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];
const DIAGNOSES = ['Hypertension', 'Type 2 Diabetes', 'Asthma', 'Migraine', 'Anxiety Disorder', 'Fracture', 'URI', 'Gastritis'];
const MEDICATIONS = ['Lisinopril', 'Metformin', 'Albuterol', 'Sumatriptan', 'Sertraline', 'Ibuprofen', 'Amoxicillin', 'Omeprazole'];

const ARTICLE_TITLES = ['The Future of AI in 2025', 'Building Scalable Systems', 'Design Patterns for Modern Apps', 'Why Rust is Gaining Popularity', 'Machine Learning in Production', 'The State of Web Development', 'Data Privacy in the Cloud Era', 'Open Source Sustainability', 'Remote Work Best Practices', 'Vector Databases Explained'];
const ARTICLE_AUTHORS = ['Sarah Chen', 'Mark Rivera', 'Priya Nair', 'Tom Eriksson', 'Fatima Al-Hassan', 'James Park', 'Laura Becker', 'Rahul Mehta'];
const TAG_NAMES = ['AI', 'Machine Learning', 'Cloud', 'DevOps', 'Security', 'Open Source', 'TypeScript', 'Python', 'Databases', 'Architecture'];
const SPECIALTIES = ['Technology', 'Science', 'Culture', 'Business', 'Health', 'Climate'];
const NEWSLETTER_STATUSES = ['active', 'unsubscribed', 'bounced', 'pending_confirmation'];

const DEVICE_TYPES = ['temperature_sensor', 'humidity_sensor', 'air_quality', 'motion_detector', 'smart_meter', 'pressure_gauge', 'vibration_sensor'];
const DEVICE_MANUFACTURERS = ['Bosch', 'Siemens', 'Honeywell', 'ABB', 'Schneider', 'Yokogawa'];
const DEVICE_STATUSES = ['online', 'offline', 'maintenance', 'error'];
const ALERT_TYPES = ['threshold_exceeded', 'device_offline', 'anomaly_detected', 'battery_low', 'calibration_needed'];
const ALERT_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const BUILDINGS = ['HQ Tower', 'Warehouse A', 'Plant B', 'Lab Complex', 'Field Station 1', 'Field Station 2'];
const MAINTENANCE_TYPES = ['firmware_update', 'calibration', 'hardware_repair', 'battery_replacement', 'routine_check'];

function buildObject(domainKey: DomainKey, className: string, index: number): Record<string, any> {
  const seed = index;
  const d = domainKey;

  if (d === 'ecommerce') {
    if (className === 'Product') return {
      name: pick(ECOMMERCE_PRODUCTS, seed),
      description: `High-quality ${pick(ECOMMERCE_PRODUCTS, seed).toLowerCase()} built for everyday use.`,
      price: parseFloat((19.99 + (seed * 7.53) % 480).toFixed(2)),
      category: pick(ECOMMERCE_CATEGORIES, seed),
      brand: pick(ECOMMERCE_BRANDS, seed),
      sku: `SKU-${String(seed + 1000).padStart(6, '0')}`,
      inStock: seed % 5 !== 0,
      rating: parseFloat((3.2 + (seed % 18) * 0.1).toFixed(1)),
      reviewCount: 12 + (seed * 37) % 843,
    };
    if (className === 'Order') return {
      orderNumber: `ORD-${String(seed + 100000).padStart(7, '0')}`,
      status: pick(ECOMMERCE_STATUSES, seed),
      totalAmount: parseFloat((12.5 + (seed * 23.7) % 890).toFixed(2)),
      itemCount: 1 + seed % 8,
      customerId: fakeId(seed % 500),
      createdAt: daysAgo(seed % 90),
      shippedAt: seed % 5 !== 0 ? daysAgo((seed % 85) + 1) : null,
      trackingNumber: seed % 4 !== 3 ? `TRK${String(seed * 7 + 1000000).slice(0, 9)}` : null,
    };
    if (className === 'Customer') return {
      firstName: pick(FIRST_NAMES, seed),
      lastName: pick(LAST_NAMES, seed + 3),
      email: `${pick(FIRST_NAMES, seed).toLowerCase()}.${pick(LAST_NAMES, seed + 3).toLowerCase()}${seed}@example.com`,
      city: pick(CITIES, seed),
      country: pick(COUNTRIES, seed),
      registeredAt: daysAgo(30 + (seed * 11) % 700),
      tier: pick(ECOMMERCE_TIERS, seed),
      totalOrders: 1 + seed % 47,
      lifetimeValue: parseFloat((49.99 + (seed * 83.4) % 5000).toFixed(2)),
    };
    if (className === 'Review') return {
      productId: fakeId(seed % 200),
      customerId: fakeId(seed % 500),
      rating: 1 + seed % 5,
      title: pick(['Great product!', 'Highly recommend', 'Good value', 'Not as expected', 'Excellent quality', 'Works perfectly', 'Average', 'Love it!'], seed),
      body: `Bought this ${pick(ECOMMERCE_PRODUCTS, seed).toLowerCase()} ${5 + seed % 60} days ago. Overall it's ${seed % 4 < 3 ? 'exactly what I needed' : 'a bit disappointing'}.`,
      helpful: seed % 42,
      verified: seed % 3 !== 0,
      createdAt: daysAgo(seed % 180),
    };
    if (className === 'Category') return {
      name: pick(ECOMMERCE_CATEGORIES, seed),
      slug: pick(ECOMMERCE_CATEGORIES, seed).toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'),
      description: `Browse our ${pick(ECOMMERCE_CATEGORIES, seed)} collection.`,
      parentCategory: seed % 3 === 0 ? null : pick(ECOMMERCE_CATEGORIES, seed + 5),
      productCount: 100 + (seed * 123) % 3500,
      featured: seed % 4 === 0,
    };
  }

  if (d === 'healthcare') {
    if (className === 'Patient') return {
      firstName: pick(FIRST_NAMES, seed),
      lastName: pick(LAST_NAMES, seed + 2),
      dateOfBirth: daysAgo(8000 + (seed * 73) % 25000),
      bloodType: pick(BLOOD_TYPES, seed),
      allergies: seed % 4 === 0 ? pick(['Penicillin', 'Sulfa', 'NSAIDs', 'Latex'], seed) : 'None known',
      primaryDoctorId: fakeId(seed % 50),
      insuranceId: `INS-${String(seed + 100000).slice(0, 9)}`,
      emergencyContact: `${pick(FIRST_NAMES, seed + 7)} ${pick(LAST_NAMES, seed + 9)}`,
    };
    if (className === 'Doctor') return {
      name: `Dr. ${pick(FIRST_NAMES, seed)} ${pick(LAST_NAMES, seed + 1)}`,
      specialty: pick(DOCTOR_SPECIALTIES, seed),
      department: pick(DEPARTMENTS, seed),
      licenseNumber: `LIC-${String(seed * 7 + 10000).slice(0, 8)}`,
      yearsExperience: 2 + seed % 30,
      available: seed % 5 !== 0,
      hospital: pick(['City General', 'St. Mary\'s', 'University Medical', 'Regional Health', 'Memorial Hospital'], seed),
    };
    if (className === 'Appointment') return {
      patientId: fakeId(seed % 200),
      doctorId: fakeId(seed % 50),
      scheduledAt: daysAgo(-(seed % 14) + 7),
      status: pick(APPT_STATUSES, seed),
      reason: pick(DIAGNOSES, seed),
      durationMinutes: pick([15, 20, 30, 45, 60], seed),
      notes: seed % 3 === 0 ? 'Follow-up required' : null,
    };
    if (className === 'MedicalRecord') return {
      patientId: fakeId(seed % 200),
      doctorId: fakeId(seed % 50),
      visitDate: daysAgo(seed % 365),
      diagnosis: pick(DIAGNOSES, seed),
      treatment: `${pick(['Prescribed', 'Referred for', 'Administered'], seed)} ${pick(MEDICATIONS, seed + 2)}`,
      prescription: pick(MEDICATIONS, seed),
      followUpDays: pick([7, 14, 30, 60, 90], seed),
    };
    if (className === 'Medication') return {
      brandName: pick(['Zestril', 'Glucophage', 'ProAir', 'Imitrex', 'Zoloft', 'Motrin', 'Amoxil', 'Prilosec'], seed),
      genericName: pick(MEDICATIONS, seed),
      dosageForm: pick(['Tablet', 'Capsule', 'Liquid', 'Inhaler', 'Injection', 'Patch'], seed),
      strength: pick(['10mg', '20mg', '50mg', '100mg', '250mg', '500mg'], seed),
      manufacturer: pick(['Pfizer', 'Merck', 'AstraZeneca', 'Novartis', 'Roche', 'GSK'], seed),
      controlled: seed % 8 === 0,
      indications: `Treatment of ${pick(DIAGNOSES, seed + 3).toLowerCase()}`,
    };
  }

  if (d === 'media') {
    if (className === 'Article') return {
      title: pick(ARTICLE_TITLES, seed),
      slug: pick(ARTICLE_TITLES, seed).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      summary: `An in-depth look at ${pick(ARTICLE_TITLES, seed).toLowerCase()} and its implications.`,
      content: `This article explores the topic in detail across multiple dimensions...`,
      authorId: fakeId(seed % 30),
      publishedAt: daysAgo(seed % 180),
      readingTimeMin: 3 + seed % 12,
      viewCount: 100 + (seed * 317) % 85000,
      featured: seed % 10 === 0,
    };
    if (className === 'Author') return {
      displayName: pick(ARTICLE_AUTHORS, seed),
      email: `${pick(ARTICLE_AUTHORS, seed).toLowerCase().replace(/ /g, '.')}@newsroom.io`,
      bio: `${pick(ARTICLE_AUTHORS, seed)} is a writer covering ${pick(SPECIALTIES, seed)}.`,
      articlesPublished: 5 + seed % 200,
      followers: 100 + (seed * 273) % 50000,
      specialty: pick(SPECIALTIES, seed),
      verified: seed % 3 !== 2,
    };
    if (className === 'Tag') return {
      name: pick(TAG_NAMES, seed),
      slug: pick(TAG_NAMES, seed).toLowerCase().replace(/ /g, '-'),
      articleCount: 10 + (seed * 47) % 1200,
      color: pick(['#ef5350', '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#26c6da'], seed),
      trending: seed % 6 === 0,
    };
    if (className === 'Comment') return {
      articleId: fakeId(seed % 300),
      authorName: `${pick(FIRST_NAMES, seed)} ${pick(LAST_NAMES, seed + 4)}`,
      content: pick(['Great read!', 'Thanks for this.', 'Disagree with point 3.', 'Very insightful article.', 'Would love a follow-up.', 'Bookmarked!'], seed),
      createdAt: daysAgo(seed % 90),
      likes: seed % 87,
      approved: seed % 10 !== 9,
      parentCommentId: seed % 4 === 0 ? fakeId(seed - 1) : null,
    };
    if (className === 'Newsletter') return {
      email: `user${seed + 1000}@${pick(['gmail.com', 'yahoo.com', 'outlook.com', 'proton.me'], seed)}`,
      subscribedAt: daysAgo(30 + (seed * 17) % 730),
      preferences: pick(['weekly_digest', 'breaking_news', 'all', 'tech_only'], seed),
      status: pick(NEWSLETTER_STATUSES, seed),
      lastEmailSentAt: seed % 7 !== 6 ? daysAgo(seed % 30) : null,
      openRate: parseFloat((0.15 + (seed % 60) * 0.01).toFixed(2)),
    };
  }

  if (d === 'iot') {
    if (className === 'Device') return {
      name: `${pick(DEVICE_TYPES, seed).replace(/_/g, '-')}-${String(seed + 1).padStart(4, '0')}`,
      type: pick(DEVICE_TYPES, seed),
      locationId: fakeId(seed % 100),
      status: pick(DEVICE_STATUSES, seed),
      firmware: `v${1 + seed % 4}.${seed % 10}.${seed % 20}`,
      batteryPercent: 10 + (seed * 17) % 90,
      lastSeen: daysAgo(seed % 3),
      manufacturer: pick(DEVICE_MANUFACTURERS, seed),
    };
    if (className === 'SensorReading') return {
      deviceId: fakeId(seed % 500),
      temperature: parseFloat((18 + (seed % 24)).toFixed(1)),
      humidity: parseFloat((30 + (seed % 60)).toFixed(1)),
      pressure: parseFloat((1013 + (seed % 20 - 10)).toFixed(1)),
      co2Ppm: 400 + (seed * 7) % 1200,
      timestamp: daysAgo(seed % 7),
      quality: pick(['good', 'moderate', 'poor'], seed),
    };
    if (className === 'Alert') return {
      deviceId: fakeId(seed % 500),
      severity: pick(ALERT_SEVERITIES, seed),
      alertType: pick(ALERT_TYPES, seed),
      message: `${pick(ALERT_TYPES, seed).replace(/_/g, ' ')} on device ${String(seed % 500).padStart(4, '0')}`,
      triggeredAt: daysAgo(seed % 14),
      resolved: seed % 3 !== 0,
      acknowledgedBy: seed % 3 !== 0 ? pick(FIRST_NAMES, seed) : null,
    };
    if (className === 'Location') return {
      name: `${pick(BUILDINGS, seed)} — Floor ${1 + seed % 5}`,
      building: pick(BUILDINGS, seed),
      floor: 1 + seed % 10,
      room: `R${String(seed + 100).slice(0, 3)}`,
      areaM2: parseFloat((20 + (seed * 13.7) % 300).toFixed(1)),
      deviceCount: 2 + seed % 25,
    };
    if (className === 'MaintenanceLog') return {
      deviceId: fakeId(seed % 500),
      maintenanceType: pick(MAINTENANCE_TYPES, seed),
      technician: `${pick(FIRST_NAMES, seed)} ${pick(LAST_NAMES, seed + 6)}`,
      scheduledAt: daysAgo(-(seed % 30)),
      completedAt: seed % 4 !== 3 ? daysAgo(-(seed % 28) + 2) : null,
      notes: seed % 5 === 0 ? 'Parts replaced' : 'No issues found',
      costUsd: parseFloat((25 + (seed * 37.5) % 800).toFixed(2)),
    };
  }

  return {};
}

// ── GraphQL mock response builder ─────────────────────────────────────────────

function buildGraphqlResponse(domainKey: DomainKey, className: string, limit: number = 10): any {
  const domain = DOMAINS[domainKey];
  const cls = domain.classes.find((c) => c.name === className);
  if (!cls) return { errors: [{ message: `Cannot query field "${className}" on type "GetObjectsObj".` }] };

  const objects = Array.from({ length: Math.min(limit, cls.objectCount) }, (_, i) => ({
    ...buildObject(domainKey, className, i),
    _additional: { id: fakeId(i), creationTimeUnix: Date.now() - i * 60000 },
  }));

  return { data: { Get: { [className]: objects } } };
}

// ── Request dispatcher ────────────────────────────────────────────────────────

async function dispatch(config: any): Promise<any> {
  const url: string = config.url || '';
  const method: string = (config.method || 'get').toLowerCase();
  const domainKey = getCurrentDomain();
  const domain = DOMAINS[domainKey];

  // POST /auth/login
  if (method === 'post' && url.includes('/auth/login')) {
    const body = JSON.parse(config.data || '{}');
    const validEmails = ['engineer1@example.com', 'engineer2@example.com'];
    if (!validEmails.includes(body.email) || body.password !== 'admin123') {
      const err: any = new Error('Invalid credentials');
      err.response = { status: 401, data: { detail: 'Invalid email or password' }, config };
      throw err;
    }
    const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6IiR7Ym9keS5lbWFpbH0iLCJuYW1lIjoiRGVtbyBVc2VyIiwicHJvamVjdF9pZCI6bnVsbCwiZXhwIjo5OTk5OTk5OTk5fQ.mock`;
    return ok(config, {
      token: mockToken,
      user: { email: body.email, name: body.email === 'engineer1@example.com' ? 'Engineer 1' : 'Engineer 2', project_id: null },
    });
  }

  // GET /auth/me
  if (url.includes('/auth/me')) {
    return ok(config, { email: 'engineer1@example.com', name: 'Demo User', project_id: null });
  }

  // GET /dashboard/overview
  if (url.includes('/dashboard/overview')) {
    const objectCounts: Record<string, number> = {};
    domain.classes.forEach((c) => { objectCounts[c.name] = c.objectCount; });
    return ok(config, {
      health: { status: 'healthy', uptime: '14d 3h 22m', last_checked: new Date().toISOString() },
      memory: domain.memory,
      object_counts: objectCounts,
      total_objects: Object.values(objectCounts).reduce((a, b) => a + b, 0),
      version: domain.version,
      hostname: domain.hostname,
      project_id: null,
    });
  }

  // GET /projects/available  — no partitioning in demo domains
  if (url.includes('/projects/available')) {
    return ok(config, { projects: [], projects_with_metadata: [], total_projects: 0 });
  }

  // GET /schema
  if (url.includes('/schema') && !url.match(/\/schema\/\w/)) {
    return ok(config, {
      classes: domain.classes.map((cls) => ({
        name: cls.name,
        description: cls.description,
        properties: cls.properties,
        vectorConfig: cls.vectorizer ? { vectorizer: cls.vectorizer } : null,
        objectCount: cls.objectCount,
      })),
    });
  }

  // GET /data/{className}/objects/{id}  — single object
  const singleMatch = url.match(/\/data\/(\w+)\/objects\/([^?/]+)/);
  if (method === 'get' && singleMatch) {
    const [, className, id] = singleMatch;
    const idx = parseInt(id.replace(/\D/g, '').slice(-4) || '0', 10) % 50;
    return ok(config, {
      id,
      class: className,
      properties: buildObject(domainKey, className, idx),
      vector: Array.from({ length: 8 }, (_, i) => parseFloat((Math.sin(i + idx) * 0.5 + 0.5).toFixed(4))),
    });
  }

  // GET /data/{className}/objects  — paginated list
  const listMatch = url.match(/\/data\/(\w+)\/objects/);
  if (method === 'get' && listMatch) {
    const [, className] = listMatch;
    const params = config.params || {};
    const limit = Math.min(parseInt(params.limit || '50', 10), 100);
    const offset = parseInt(params.offset || '0', 10);
    const cls = domain.classes.find((c) => c.name === className);
    if (!cls) {
      const err: any = new Error('Not found');
      err.response = { status: 404, data: { detail: `Class '${className}' not found` }, config };
      throw err;
    }
    const totalCount = cls.objectCount;
    const objects = Array.from({ length: limit }, (_, i) => ({
      id: fakeId(offset + i),
      properties: buildObject(domainKey, className, offset + i),
    }));
    return ok(config, { objects, total_count: totalCount, limit, offset, class_name: className });
  }

  // POST /query/execute
  if (method === 'post' && url.includes('/query/execute')) {
    const body = JSON.parse(config.data || '{}');
    const query: string = body.query || '';
    // Extract class name from GraphQL (first word after Get { or Aggregate {)
    const getMatch = query.match(/Get\s*\{\s*(\w+)/);
    const aggMatch = query.match(/Aggregate\s*\{\s*(\w+)/);
    const className = (getMatch || aggMatch)?.[1];

    if (!className) {
      return ok(config, { data: null, errors: [{ message: 'Could not parse class name from query.' }], execution_time_ms: 12 });
    }

    const cls = domain.classes.find((c) => c.name === className);
    if (!cls) {
      return ok(config, {
        data: null,
        errors: [{ message: `Cannot query field "${className}" on type "GetObjectsObj". Did you mean ${domain.classes.map((c) => `"${c.name}"`).join(', ')}?` }],
        execution_time_ms: 8,
      });
    }

    const isAggregate = !!aggMatch;
    let resultData: any;
    if (isAggregate) {
      resultData = { data: { Aggregate: { [className]: [{ meta: { count: cls.objectCount } }] } } };
    } else {
      resultData = buildGraphqlResponse(domainKey, className, 10);
    }

    return ok(config, { ...resultData, execution_time_ms: 45 + Math.floor(Math.random() * 80) });
  }

  // Health check
  if (url.includes('/health')) {
    return ok(config, { status: 'healthy' });
  }

  // Fallback — return empty 200
  return ok(config, {});
}

// ── Public export — wire this into axios ──────────────────────────────────────

export function createMockAdapter() {
  return async function mockAdapter(config: any): Promise<any> {
    await delay(60 + Math.random() * 80); // realistic ~60-140ms latency
    return dispatch(config);
  };
}
