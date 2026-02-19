# Track Plan: External API Platform - Partner Data Services

## Phase 1: API Gateway Infrastructure

Establish the core API gateway, authentication, and request handling infrastructure.

### 1.1 Gateway Setup
- [x] Task: Design API gateway architecture (evaluate Wix HTTP functions vs external gateway)
- [x] Task: Create `apiGateway.js` HTTP functions entry point in `src/backend/`
- [x] Task: Implement request routing layer for `/v1/` endpoints
- [x] Task: Create request validation middleware (schema validation)
- [x] Task: Implement response formatting standardization (JSON structure)
- [x] Task: Create error handling middleware with standard error codes
- [x] Task: Implement request logging to `ApiRequestLog` collection
- [x] Task: Set up CORS configuration for API access

### 1.2 Authentication System
- [x] Task: Create `ApiPartners` collection with schema from spec
- [x] Task: Create `apiAuthService.jsw` for authentication logic
- [x] Task: Implement API key generation (64-char secure random)
- [x] Task: Implement API key hashing (bcrypt) for secure storage
- [x] Task: Implement `validateApiKey(key)` authentication function
- [x] Task: Implement API key lookup with partner tier resolution
- [x] Task: Add `Authorization: Bearer` header parsing
- [x] Task: Create API key rotation functionality
- [x] Task: Implement IP whitelist validation (optional per partner)
- [x] Task: Add authentication middleware to gateway

### 1.3 Rate Limiting
- [x] Task: Design rate limiting strategy (sliding window)
- [x] Task: Create `rateLimitService.jsw` for rate limit logic
- [x] Task: Implement per-minute rate limiting with counter
- [x] Task: Implement per-month quota tracking in `ApiUsage`
- [x] Task: Implement per-endpoint rate limit overrides
- [x] Task: Add rate limit headers to responses (`X-RateLimit-*`)
- [x] Task: Implement 429 response with `Retry-After` header
- [x] Task: Create rate limit bypass for internal testing

### 1.4 Collections Setup
- [x] Task: Create `ApiSubscriptions` collection with schema from spec
- [x] Task: Create `ApiUsage` collection with schema from spec
- [x] Task: Create `ApiRequestLog` collection with indexes (partner_id, created_at)
- [x] Task: Create `ApiProducts` collection for product configuration
- [x] Task: Seed `ApiProducts` with initial product definitions
- [x] Task: Create indexes for efficient query patterns

### 1.5 Testing - Phase 1
- [x] Task: Write unit tests for API key validation
- [x] Task: Write unit tests for rate limiting logic
- [x] Task: Write unit tests for request routing
- [x] Task: Test authentication flow end-to-end
- [x] Task: Test rate limiting with burst traffic
- [x] Task: Test error response formatting
- [x] Task: Manual test: Make authenticated API request
- [x] Task: Conductor - User Manual Verification 'Phase 1: Gateway Infrastructure'

---

## Phase 2: Safety & Compliance APIs

Expose FMCSA and CSA monitoring capabilities as external APIs.

### 2.1 FMCSA Carrier Lookup API
- [x] Task: Create `/v1/safety/carrier/{dot_number}` endpoint
- [x] Task: Create `externalFmcsaApi.jsw` wrapper service
- [x] Task: Implement request validation (DOT number format)
- [x] Task: Integrate with existing `fmcsaService.jsw`
- [x] Task: Format response to external API schema
- [x] Task: Implement caching layer (7-day TTL)
- [x] Task: Add usage metering for billing
- [x] Task: Document endpoint in OpenAPI spec

### 2.2 FMCSA Batch Lookup API
- [x] Task: Create `POST /v1/safety/carriers/batch` endpoint
- [x] Task: Implement batch processing (max 100 DOT numbers)
- [x] Task: Implement parallel fetching with rate limiting
- [x] Task: Return partial results on partial failures
- [x] Task: Add batch-specific rate limits
- [x] Task: Document batch endpoint

### 2.3 CSA Score Monitor API
- [x] Task: Create `/v1/safety/csa/{dot_number}/history` endpoint
- [x] Task: Create `externalCsaApi.jsw` wrapper service
- [x] Task: Integrate with existing `csaMonitorService.jsw`
- [x] Task: Implement historical data retrieval (6 months)
- [x] Task: Calculate and include trend analysis
- [x] Task: Format response with recommendations
- [x] Task: Document endpoint

### 2.4 CSA Current Scores API
- [x] Task: Create `/v1/safety/csa/{dot_number}` endpoint (current only)
- [x] Task: Implement lightweight response for current scores
- [x] Task: Add alert status indicators
- [x] Task: Document endpoint

### 2.5 Compliance Alerts API
- [x] Task: Create `POST /v1/safety/alerts/subscribe` endpoint
- [x] Task: Create `ApiAlertSubscriptions` collection
- [x] Task: Implement webhook subscription management
- [x] Task: Create `GET /v1/safety/alerts/subscriptions` to list
- [x] Task: Create `DELETE /v1/safety/alerts/{subscription_id}`
- [x] Task: Implement webhook delivery service
- [x] Task: Implement webhook retry logic (3 attempts, exponential backoff)
- [x] Task: Create webhook signature generation (HMAC-SHA256)
- [x] Task: Document webhook payload formats

### 2.6 Safety API Documentation
- [x] Task: Write OpenAPI 3.0 spec for all Safety APIs
- [x] Task: Create code examples (cURL, JavaScript, Python)
- [x] Task: Write integration guide for Safety APIs
- [x] Task: Create Postman collection for Safety APIs

### 2.7 Testing - Phase 2
- [x] Task: Write unit tests for FMCSA API endpoint
- [x] Task: Write unit tests for CSA API endpoints
- [x] Task: Write unit tests for alert subscription
- [x] Task: Write unit tests for webhook delivery
- [x] Task: Test batch API with edge cases
- [x] Task: Test webhook retry logic
- [x] Task: Manual test: Full safety API flow
- [x] Task: Conductor - User Manual Verification 'Phase 2: Safety APIs'

---

## Phase 3: Intelligence APIs

Expose AI-enriched carrier intelligence and sentiment analysis.

### 3.1 Carrier Intelligence API
- [x] Task: Create `/v1/intelligence/carrier/{dot_number}` endpoint
- [x] Task: Create `externalIntelligenceApi.jsw` wrapper service
- [x] Task: Integrate with existing `aiEnrichment.jsw`
- [x] Task: Format enrichment data for external schema
- [x] Task: Implement confidence level mapping
- [x] Task: Add source attribution in response
- [x] Task: Implement caching (14-day TTL matching internal)
- [x] Task: Add tier-based access (Basic vs Full enrichment)
- [x] Task: Document endpoint

### 3.2 Social Sentiment API
- [x] Task: Create `/v1/intelligence/sentiment/{dot_number}` endpoint
- [x] Task: Integrate with existing `socialScanner.jsw`
- [x] Task: Format sentiment analysis for external schema
- [x] Task: Include platform breakdown (Reddit, TruckersReport, Twitter)
- [x] Task: Add key themes extraction
- [x] Task: Include recent mention snippets (sanitized)
- [x] Task: Implement rate limiting for expensive social scans
- [x] Task: Document endpoint

### 3.3 Market Intelligence API
- [x] Task: Create `/v1/intelligence/market` endpoint
- [x] Task: Create `marketIntelligenceService.jsw` aggregation service
- [x] Task: Implement regional filtering (state, region codes)
- [x] Task: Implement freight type filtering
- [x] Task: Implement operation type filtering
- [x] Task: Aggregate CPM benchmarks from enrichment data
- [x] Task: Calculate demand index from hiring signals
- [x] Task: Identify top hiring carriers by region
- [x] Task: Cache aggregated market data (daily refresh)
- [x] Task: Document endpoint

### 3.4 Carrier Search API
- [x] Task: Create `POST /v1/intelligence/carriers/search` endpoint
- [x] Task: Implement multi-criteria carrier search
- [x] Task: Filter by safety rating, fleet size, sentiment
- [x] Task: Sort by match score or individual criteria
- [x] Task: Implement pagination
- [x] Task: Document endpoint

### 3.5 Intelligence API Documentation
- [x] Task: Write OpenAPI spec for Intelligence APIs
- [x] Task: Create code examples
- [x] Task: Write integration guide
- [x] Task: Create Postman collection

### 3.6 Testing - Phase 3
- [x] Task: Write unit tests for Carrier Intelligence API
- [x] Task: Write unit tests for Sentiment API
- [x] Task: Write unit tests for Market Intelligence API
- [x] Task: Test tier-based access restrictions
- [x] Task: Test caching behavior
- [x] Task: Manual test: Full intelligence API flow
- [x] Task: Conductor - User Manual Verification 'Phase 3: Intelligence APIs'

---

## Phase 4: Operational APIs

Expose truck parking, fuel pricing, and route planning capabilities.

### 4.1 Truck Parking Search API
- [x] Task: Create `/v1/parking/search` endpoint
- [x] Task: Create `externalParkingApi.jsw` wrapper service
- [x] Task: Integrate with existing `parkingService.jsw`
- [x] Task: Implement geo-search with radius parameter
- [x] Task: Implement amenity filtering
- [x] Task: Include data source attribution (TPIMS, community)
- [x] Task: Include confidence levels for availability
- [x] Task: Format response for external schema
- [x] Task: Implement short-term caching (5 minutes)
- [x] Task: Document endpoint

### 4.2 Parking Location Details API
- [x] Task: Create `/v1/parking/location/{id}` endpoint
- [x] Task: Return detailed location information
- [x] Task: Include historical availability patterns
- [x] Task: Include all amenities and reviews
- [x] Task: Document endpoint

### 4.3 Fuel Pricing Search API
- [x] Task: Create `/v1/fuel/prices` endpoint
- [x] Task: Create `externalFuelApi.jsw` wrapper service
- [x] Task: Integrate with existing `fuelService.jsw`
- [x] Task: Implement geo-search with radius
- [x] Task: Implement fuel card discount calculations
- [x] Task: Include DEF availability and pricing
- [x] Task: Include regional/state averages
- [x] Task: Document endpoint

### 4.4 Route Fuel Planner API
- [x] Task: Create `POST /v1/fuel/plan` endpoint
- [x] Task: Implement route sampling for fuel stops
- [x] Task: Calculate optimal stop locations
- [x] Task: Apply fuel card discounts to recommendations
- [x] Task: Calculate total trip fuel cost estimate
- [x] Task: Calculate savings with recommended stops
- [x] Task: Document endpoint

### 4.5 Fuel Station Details API
- [x] Task: Create `/v1/fuel/station/{id}` endpoint
- [x] Task: Return detailed station information
- [x] Task: Include all fuel card discounts
- [x] Task: Include amenity list
- [x] Task: Document endpoint

### 4.6 Operational API Documentation
- [x] Task: Write OpenAPI spec for Operational APIs
- [x] Task: Create code examples
- [x] Task: Write integration guide for TMS platforms
- [x] Task: Create Postman collection

### 4.7 Testing - Phase 4
- [x] Task: Write unit tests for Parking Search API
- [x] Task: Write unit tests for Fuel Pricing API
- [x] Task: Write unit tests for Route Planner API
- [x] Task: Test geo-search accuracy
- [x] Task: Test fuel card discount calculations
- [x] Task: Test route planning algorithm
- [x] Task: Manual test: Full operational API flow
- [x] Task: Conductor - User Manual Verification 'Phase 4: Operational APIs'

---

## Phase 5: Matching APIs

Expose driver search and carrier matching capabilities.

### 5.1 Driver Search API (Enterprise Only)
- [x] Task: Create `POST /v1/matching/drivers/search` endpoint
- [x] Task: Create `externalMatchingApi.jsw` wrapper service
- [x] Task: Integrate with existing `driverMatching.jsw`
- [x] Task: Implement CDL class filtering
- [x] Task: Implement endorsement filtering (must have all)
- [x] Task: Implement experience filtering
- [x] Task: Implement location/distance filtering
- [x] Task: Implement availability filtering
- [x] Task: Calculate and include match scores
- [x] Task: Implement PII masking for non-authorized access
- [x] Task: Implement credit-based usage tracking
- [x] Task: Enforce Enterprise tier requirement
- [x] Task: Document endpoint

### 5.2 Driver Profile API
- [x] Task: Create `/v1/matching/driver/{driver_id}` endpoint
- [x] Task: Return driver profile (with PII controls)
- [x] Task: Include qualification summary
- [x] Task: Implement authorization check (credit consumed)
- [x] Task: Document endpoint

### 5.3 Carrier Match API
- [x] Task: Create `POST /v1/matching/carriers` endpoint
- [x] Task: Integrate with existing `carrierMatching.jsw`
- [x] Task: Accept driver profile as input
- [x] Task: Return ranked carrier recommendations
- [x] Task: Include match score breakdown
- [x] Task: Optionally include enrichment data
- [x] Task: Document endpoint

### 5.4 Qualification Check API
- [x] Task: Create `POST /v1/matching/qualify` endpoint
- [x] Task: Accept driver qualifications and carrier requirements
- [x] Task: Return qualification match result
- [x] Task: Identify missing qualifications
- [x] Task: Document endpoint

### 5.5 Matching API Documentation
- [x] Task: Write OpenAPI spec for Matching APIs
- [x] Task: Create code examples for staffing agency integration
- [x] Task: Write integration guide
- [x] Task: Create Postman collection

### 5.6 Testing - Phase 5
- [x] Task: Write unit tests for Driver Search API
- [x] Task: Write unit tests for Carrier Match API
- [x] Task: Test tier enforcement (Enterprise only)
- [x] Task: Test PII masking
- [x] Task: Test credit tracking
- [x] Task: Manual test: Full matching API flow
- [x] Task: Conductor - User Manual Verification 'Phase 5: Matching APIs'

---

## Phase 6: Document APIs

Expose CDL OCR extraction and document verification capabilities.

### 6.1 CDL Extraction API
- [x] Task: Create `POST /v1/documents/cdl/extract` endpoint
- [x] Task: Create `externalDocumentApi.jsw` wrapper service
- [x] Task: Integrate with existing `ocrService.jsw`
- [x] Task: Implement file upload handling (multipart/form-data)
- [x] Task: Accept base64 encoded images as alternative
- [x] Task: Implement file size limits (10MB max)
- [x] Task: Implement supported format validation (JPEG, PNG, PDF)
- [x] Task: Format extraction result for external schema
- [x] Task: Include verification status (format, state, expiration)
- [x] Task: Implement extraction credit tracking
- [x] Task: Document endpoint

### 6.2 Medical Certificate Extraction API
- [x] Task: Create `POST /v1/documents/medcert/extract` endpoint
- [x] Task: Implement medical certificate OCR
- [x] Task: Extract examiner registry number
- [x] Task: Validate certificate expiration
- [x] Task: Document endpoint

### 6.3 Document Verification API
- [x] Task: Create `POST /v1/documents/verify` endpoint
- [x] Task: Accept previously extracted document ID
- [x] Task: Perform additional verification checks
- [x] Task: Return verification result with confidence
- [x] Task: Document endpoint

### 6.4 Batch Document Processing API
- [x] Task: Create `POST /v1/documents/batch` endpoint
- [x] Task: Accept multiple documents for processing
- [x] Task: Implement async processing with webhook callback
- [x] Task: Return batch job ID for status checking
- [x] Task: Create `/v1/documents/batch/{job_id}` status endpoint
- [x] Task: Document batch processing flow

### 6.5 Document API Documentation
- [x] Task: Write OpenAPI spec for Document APIs
- [x] Task: Create code examples for HR integration
- [x] Task: Write integration guide for background check systems
- [x] Task: Create Postman collection

### 6.6 Testing - Phase 6
- [x] Task: Write unit tests for CDL extraction endpoint
- [x] Task: Write unit tests for medical cert extraction
- [x] Task: Test file upload handling
- [x] Task: Test extraction accuracy with sample documents
- [x] Task: Test batch processing flow
- [x] Task: Manual test: Full document API flow
- [x] Task: Conductor - User Manual Verification 'Phase 6: Document APIs'

---

## Phase 7: Engagement APIs (Gamification White-Label)

Expose gamification system for partner integration.

### 7.1 User Progress API
- [x] Task: Create `/v1/engagement/user/{user_id}/progress` endpoint
- [x] Task: Create `externalEngagementApi.jsw` wrapper service
- [x] Task: Integrate with gamification services
- [x] Task: Return progression data (level, XP, streaks)
- [x] Task: Return earned badges and achievements
- [x] Task: Implement partner-scoped user mapping
- [x] Task: Document endpoint

### 7.2 XP Award API
- [x] Task: Create `POST /v1/engagement/xp/award` endpoint
- [x] Task: Allow partners to award XP for custom actions
- [x] Task: Validate action types and XP amounts
- [x] Task: Implement daily caps to prevent abuse
- [x] Task: Trigger level-up checks
- [x] Task: Document endpoint

### 7.3 Achievement Check API
- [x] Task: Create `POST /v1/engagement/achievements/check` endpoint
- [x] Task: Allow partners to trigger achievement checks
- [x] Task: Return newly earned achievements
- [x] Task: Document endpoint

### 7.4 Leaderboard API
- [x] Task: Create `/v1/engagement/leaderboard` endpoint
- [x] Task: Return leaderboard rankings
- [x] Task: Support filtering by period (weekly, monthly)
- [x] Task: Support filtering by type
- [x] Task: Document endpoint

### 7.5 Engagement Webhooks
- [x] Task: Create `POST /v1/engagement/webhooks/subscribe` endpoint
- [x] Task: Implement achievement event webhooks
- [x] Task: Implement level-up event webhooks
- [x] Task: Implement streak milestone webhooks
- [x] Task: Document webhook payloads

### 7.6 Engagement API Documentation
- [x] Task: Write OpenAPI spec for Engagement APIs
- [x] Task: Create white-label integration guide
- [x] Task: Document partner-scoped user mapping
- [x] Task: Create Postman collection

### 7.7 Testing - Phase 7
- [x] Task: Write unit tests for Progress API
- [x] Task: Write unit tests for XP Award API
- [x] Task: Test achievement webhook delivery
- [x] Task: Test level-up triggers
- [x] Task: Manual test: Full engagement API flow
- [x] Task: Conductor - User Manual Verification 'Phase 7: Engagement APIs'

---

## Phase 8: Developer Portal & Partner Management

Build self-service developer portal and partner management tools.

### 8.1 Developer Portal - Backend
- [x] Task: Create `apiPortalService.jsw` for portal operations
- [x] Task: Implement partner registration flow
- [x] Task: Implement API key management (create, rotate, revoke)
- [x] Task: Implement usage dashboard data aggregation
- [x] Task: Implement billing history retrieval
- [x] Task: Implement webhook testing endpoint
- [x] Task: Implement sandbox environment switching

### 8.2 Developer Portal - Frontend
- [x] Task: Create `API_PORTAL_DASHBOARD.html` in `src/public/admin/`
- [x] Task: Build dashboard with usage stats
- [x] Task: Build API key management UI
- [x] Task: Build usage charts (daily, monthly)
- [x] Task: Build endpoint-level usage breakdown
- [x] Task: Build webhook management UI
- [x] Task: Build sandbox/production environment toggle
- [x] Task: Style with LMDR theme

### 8.3 API Documentation Site
- [x] Task: Create interactive API documentation page
- [x] Task: Implement "Try It" feature with sandbox
- [x] Task: Create code examples in multiple languages
- [x] Task: Build changelog page
- [x] Task: Create status page for API health
- [x] Task: Implement search functionality

### 8.4 Billing Integration
- [x] Task: Create Stripe products for API tiers
- [x] Task: Implement subscription checkout flow
- [x] Task: Implement usage-based billing calculation
- [x] Task: Implement overage invoice generation
- [x] Task: Create billing portal link for partners
- [x] Task: Implement subscription upgrade/downgrade
- [x] Task: Create billing webhooks for subscription events

### 8.5 Admin Tools
- [x] Task: Create `ADMIN_API_PARTNERS.html` for partner management
- [x] Task: Build partner list with status and usage
- [x] Task: Build partner detail view with full history
- [x] Task: Implement manual tier override capability
- [x] Task: Implement partner suspension capability
- [x] Task: Build usage analytics dashboard
- [x] Task: Build revenue reporting

### 8.6 Partner Onboarding
- [x] Task: Create partner onboarding email sequence
- [x] Task: Create "Getting Started" documentation
- [x] Task: Create onboarding checklist in portal
- [x] Task: Implement first API call tracking
- [x] Task: Create automated onboarding follow-ups

### 8.7 SDK Development
- [x] Task: Create JavaScript/Node.js SDK (`@lmdr/api-client`)
- [x] Task: Create Python SDK (`lmdr-python`)
- [x] Task: Create SDK documentation
- [x] Task: Publish SDKs to npm and PyPI
- [x] Task: Create SDK code examples

### 8.8 Testing - Phase 8
- [x] Task: Test partner registration flow
- [x] Task: Test API key management
- [x] Task: Test billing integration
- [x] Task: Test SDK functionality
- [x] Task: Test portal responsiveness
- [x] Task: Manual test: Full partner onboarding flow
- [x] Task: Conductor - User Manual Verification 'Phase 8: Developer Portal'

---

## Post-Launch Tasks

### Monitoring & Operations
- [ ] Task: Set up API uptime monitoring
- [ ] Task: Create alerting for error rate spikes
- [ ] Task: Create alerting for latency degradation
- [ ] Task: Implement distributed tracing for API requests
- [ ] Task: Create operational runbook for incidents
- [ ] Task: Set up on-call rotation for API support

### Analytics & Reporting
- [ ] Task: Create partner usage reports (weekly, monthly)
- [ ] Task: Create revenue analytics dashboard
- [ ] Task: Track API adoption by endpoint
- [ ] Task: Measure time-to-first-call for new partners
- [ ] Task: Track partner churn and retention

### Optimization
- [ ] Task: Implement response caching (Redis/CDN)
- [ ] Task: Optimize slow endpoints based on latency data
- [ ] Task: Implement request batching for common patterns
- [ ] Task: Add CDN for documentation and static assets

### Partner Success
- [ ] Task: Create partner feedback survey
- [ ] Task: Schedule quarterly business reviews with top partners
- [ ] Task: Create partner newsletter for API updates
- [ ] Task: Implement feature request tracking
- [ ] Task: Create partner case studies

### Compliance & Security
- [ ] Task: Complete security audit of API infrastructure
- [ ] Task: Implement API penetration testing
- [ ] Task: Create data processing agreement template
- [ ] Task: Document data retention policies
- [ ] Task: Evaluate SOC 2 Type II certification

### Future Enhancements
- [ ] Task: Evaluate GraphQL endpoint addition
- [ ] Task: Plan mobile SDK development
- [ ] Task: Design reseller/white-label program
- [ ] Task: Plan international expansion (data residency)
- [ ] Task: Evaluate real-time streaming APIs (WebSocket)
