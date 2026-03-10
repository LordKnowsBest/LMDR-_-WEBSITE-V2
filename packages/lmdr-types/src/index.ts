export interface DriverProfile {
  _id: string;
  memberId: string;
  cdlClass: 'A' | 'B' | 'C';
  yearsExperience: number;
  homeState: string;
  freightPreference: string[];
  docsSubmitted: boolean;
  isSearchable: boolean;
  visibilityLevel: 'public' | 'private' | 'recruiter-only';
  onboardingStep: number;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  _id: string;
  carrierId: string;
  title: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  cdlRequired: string;
  freightType: string;
  payPerMile: number;
  homeTime: string;
  status: 'open' | 'filled' | 'paused' | 'closed';
  postedAt: string;
}

export interface Carrier {
  _id: string;
  dotNumber: number;
  companyName: string;
  combinedScore: number;
  state: string;
  numTrucks: number;
  payPerMile: number;
  homeTime: string;
  freightType: string;
  isEnriched: boolean;
  lastEnrichedAt: string;
}

export interface MatchResult {
  jobId: string;
  carrierId: string;
  driverId: string;
  score: number;
  explanation: string;
  factors: Record<string, number>;
}

export interface NotificationPayload {
  recipientId: string;
  channel: 'email' | 'sms' | 'push';
  subject?: string;
  body: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEvent {
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  timestamp: string;
}

export interface ComplianceStatus {
  driverId: string;
  mvrStatus: 'pending' | 'clear' | 'flagged' | 'failed';
  backgroundStatus: 'pending' | 'clear' | 'flagged' | 'failed';
  cdlVerified: boolean;
  lastChecked: string;
  expiresAt?: string;
}

export interface Invoice {
  _id: string;
  carrierId: string;
  driverId?: string;
  lineItems: InvoiceLineItem[];
  totalAmount: number;
  currency: 'USD';
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  statusCode: number;
}

export interface QueryFilters {
  field: string;
  operator: string;
  value: unknown;
}

export interface SortClause {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  filters?: QueryFilters[];
  limit?: number;
  skip?: number;
  sort?: SortClause[];
}
