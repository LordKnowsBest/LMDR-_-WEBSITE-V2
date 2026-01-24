# Track Plan: External API Platform - Partner Data Services

## Phase 1: API Gateway Infrastructure

Establish the core API gateway, authentication, and request handling infrastructure.

### 1.1 Gateway Setup
- [ ] Task: Design API gateway architecture (evaluate Wix HTTP functions vs external gateway)
- [ ] Task: Create `apiGateway.js` HTTP functions entry point in `src/backend/`
- [ ] Task: Implement request routing layer for `/v1/` endpoints
- [ ] Task: Create request validation middleware (schema validation)
- [ ] Task: Implement response formatting standardization (JSON structure)
- [ ] Task: Create error handling middleware with standard error codes
- [ ] Task: Implement request logging to `ApiRequestLog` collection
- [ ] Task: Set up CORS configuration for API access

### 1.2 Authentication System
- [ ] Task: Create `ApiPartners` collection with schema from spec
- [ ] Task: Create `apiAuthService.jsw` for authentication logic
- [ ] Task: Implement API key generation (64-char secure random)
- [ ] Task: Implement API key hashing (bcrypt) for secure storage
- [ ] Task: Implement `validateApiKey(key)` authentication function
- [ ] Task: Implement API key lookup with partner tier resolution
- [ ] Task: Add `Authorization: Bearer` header parsing
- [ ] Task: Create API key rotation functionality
- [ ] Task: Implement IP whitelist validation (optional per partner)
- [ ] Task: Add authentication middleware to gateway

### 1.3 Rate Limiting
- [ ] Task: Design rate limiting strategy (sliding window)
- [ ] Task: Create `rateLimitService.jsw` for rate limit logic
- [ ] Task: Implement per-minute rate limiting with counter
- [ ] Task: Implement per-month quota tracking in `ApiUsage`
- [ ] Task: Implement per-endpoint rate limit overrides
- [ ] Task: Add rate limit headers to responses (`X-RateLimit-*`)
- [ ] Task: Implement 429 response with `Retry-After` header
- [ ] Task: Create rate limit bypass for internal testing

### 1.4 Collections Setup
- [ ] Task: Create `ApiSubscriptions` collection with schema from spec
- [ ] Task: Create `ApiUsage` collection with schema from spec
- [ ] Task: Create `ApiRequestLog` collection with indexes (partner_id, created_at)
- [ ] Task: Create `ApiProducts` collection for product configuration
- [ ] Task: Seed `ApiProducts` with initial product definitions
- [ ] Task: Create indexes for efficient query patterns

### 1.5 Testing - Phase 1
- [ ] Task: Write unit tests for API key validation
- [ ] Task: Write unit tests for rate limiting logic
- [ ] Task: Write unit tests for request routing
- [ ] Task: Test authentication flow end-to-end
- [ ] Task: Test rate limiting with burst traffic
- [ ] Task: Test error response formatting
- [ ] Task: Manual test: Make authenticated API request
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Gateway Infrastructure'

---

## Phase 2: Safety & Compliance APIs

Expose FMCSA and CSA monitoring capabilities as external APIs.

### 2.1 FMCSA Carrier Lookup API
- [ ] Task: Create `/v1/safety/carrier/{dot_number}` endpoint
- [ ] Task: Create `externalFmcsaApi.jsw` wrapper service
- [ ] Task: Implement request validation (DOT number format)
- [ ] Task: Integrate with existing `fmcsaService.jsw`
- [ ] Task: Format response to external API schema
- [ ] Task: Implement caching layer (7-day TTL)
- [ ] Task: Add usage metering for billing
- [ ] Task: Document endpoint in OpenAPI spec

### 2.2 FMCSA Batch Lookup API
- [ ] Task: Create `POST /v1/safety/carriers/batch` endpoint
- [ ] Task: Implement batch processing (max 100 DOT numbers)
- [ ] Task: Implement parallel fetching with rate limiting
- [ ] Task: Return partial results on partial failures
- [ ] Task: Add batch-specific rate limits
- [ ] Task: Document batch endpoint

### 2.3 CSA Score Monitor API
- [ ] Task: Create `/v1/safety/csa/{dot_number}/history` endpoint
- [ ] Task: Create `externalCsaApi.jsw` wrapper service
- [ ] Task: Integrate with existing `csaMonitorService.jsw`
- [ ] Task: Implement historical data retrieval (6 months)
- [ ] Task: Calculate and include trend analysis
- [ ] Task: Format response with recommendations
- [ ] Task: Document endpoint

### 2.4 CSA Current Scores API
- [ ] Task: Create `/v1/safety/csa/{dot_number}` endpoint (current only)
- [ ] Task: Implement lightweight response for current scores
- [ ] Task: Add alert status indicators
- [ ] Task: Document endpoint

### 2.5 Compliance Alerts API
- [ ] Task: Create `POST /v1/safety/alerts/subscribe` endpoint
- [ ] Task: Create `ApiAlertSubscriptions` collection
- [ ] Task: Implement webhook subscription management
- [ ] Task: Create `GET /v1/safety/alerts/subscriptions` to list
- [ ] Task: Create `DELETE /v1/safety/alerts/{subscription_id}`
- [ ] Task: Implement webhook delivery service
- [ ] Task: Implement webhook retry logic (3 attempts, exponential backoff)
- [ ] Task: Create webhook signature generation (HMAC-SHA256)
- [ ] Task: Document webhook payload formats

### 2.6 Safety API Documentation
- [ ] Task: Write OpenAPI 3.0 spec for all Safety APIs
- [ ] Task: Create code examples (cURL, JavaScript, Python)
- [ ] Task: Write integration guide for Safety APIs
- [ ] Task: Create Postman collection for Safety APIs

### 2.7 Testing - Phase 2
- [ ] Task: Write unit tests for FMCSA API endpoint
- [ ] Task: Write unit tests for CSA API endpoints
- [ ] Task: Write unit tests for alert subscription
- [ ] Task: Write unit tests for webhook delivery
- [ ] Task: Test batch API with edge cases
- [ ] Task: Test webhook retry logic
- [ ] Task: Manual test: Full safety API flow
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Safety APIs'

---

## Phase 3: Intelligence APIs

Expose AI-enriched carrier intelligence and sentiment analysis.

### 3.1 Carrier Intelligence API
- [ ] Task: Create `/v1/intelligence/carrier/{dot_number}` endpoint
- [ ] Task: Create `externalIntelligenceApi.jsw` wrapper service
- [ ] Task: Integrate with existing `aiEnrichment.jsw`
- [ ] Task: Format enrichment data for external schema
- [ ] Task: Implement confidence level mapping
- [ ] Task: Add source attribution in response
- [ ] Task: Implement caching (14-day TTL matching internal)
- [ ] Task: Add tier-based access (Basic vs Full enrichment)
- [ ] Task: Document endpoint

### 3.2 Social Sentiment API
- [ ] Task: Create `/v1/intelligence/sentiment/{dot_number}` endpoint
- [ ] Task: Integrate with existing `socialScanner.jsw`
- [ ] Task: Format sentiment analysis for external schema
- [ ] Task: Include platform breakdown (Reddit, TruckersReport, Twitter)
- [ ] Task: Add key themes extraction
- [ ] Task: Include recent mention snippets (sanitized)
- [ ] Task: Implement rate limiting for expensive social scans
- [ ] Task: Document endpoint

### 3.3 Market Intelligence API
- [ ] Task: Create `/v1/intelligence/market` endpoint
- [ ] Task: Create `marketIntelligenceService.jsw` aggregation service
- [ ] Task: Implement regional filtering (state, region codes)
- [ ] Task: Implement freight type filtering
- [ ] Task: Implement operation type filtering
- [ ] Task: Aggregate CPM benchmarks from enrichment data
- [ ] Task: Calculate demand index from hiring signals
- [ ] Task: Identify top hiring carriers by region
- [ ] Task: Cache aggregated market data (daily refresh)
- [ ] Task: Document endpoint

### 3.4 Carrier Search API
- [ ] Task: Create `POST /v1/intelligence/carriers/search` endpoint
- [ ] Task: Implement multi-criteria carrier search
- [ ] Task: Filter by safety rating, fleet size, sentiment
- [ ] Task: Sort by match score or individual criteria
- [ ] Task: Implement pagination
- [ ] Task: Document endpoint

### 3.5 Intelligence API Documentation
- [ ] Task: Write OpenAPI spec for Intelligence APIs
- [ ] Task: Create code examples
- [ ] Task: Write integration guide
- [ ] Task: Create Postman collection

### 3.6 Testing - Phase 3
- [ ] Task: Write unit tests for Carrier Intelligence API
- [ ] Task: Write unit tests for Sentiment API
- [ ] Task: Write unit tests for Market Intelligence API
- [ ] Task: Test tier-based access restrictions
- [ ] Task: Test caching behavior
- [ ] Task: Manual test: Full intelligence API flow
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Intelligence APIs'

---

## Phase 4: Operational APIs

Expose truck parking, fuel pricing, and route planning capabilities.

### 4.1 Truck Parking Search API
- [ ] Task: Create `/v1/parking/search` endpoint
- [ ] Task: Create `externalParkingApi.jsw` wrapper service
- [ ] Task: Integrate with existing `parkingService.jsw`
- [ ] Task: Implement geo-search with radius parameter
- [ ] Task: Implement amenity filtering
- [ ] Task: Include data source attribution (TPIMS, community)
- [ ] Task: Include confidence levels for availability
- [ ] Task: Format response for external schema
- [ ] Task: Implement short-term caching (5 minutes)
- [ ] Task: Document endpoint

### 4.2 Parking Location Details API
- [ ] Task: Create `/v1/parking/location/{id}` endpoint
- [ ] Task: Return detailed location information
- [ ] Task: Include historical availability patterns
- [ ] Task: Include all amenities and reviews
- [ ] Task: Document endpoint

### 4.3 Fuel Pricing Search API
- [ ] Task: Create `/v1/fuel/prices` endpoint
- [ ] Task: Create `externalFuelApi.jsw` wrapper service
- [ ] Task: Integrate with existing `fuelService.jsw`
- [ ] Task: Implement geo-search with radius
- [ ] Task: Implement fuel card discount calculations
- [ ] Task: Include DEF availability and pricing
- [ ] Task: Include regional/state averages
- [ ] Task: Document endpoint

### 4.4 Route Fuel Planner API
- [ ] Task: Create `POST /v1/fuel/plan` endpoint
- [ ] Task: Implement route sampling for fuel stops
- [ ] Task: Calculate optimal stop locations
- [ ] Task: Apply fuel card discounts to recommendations
- [ ] Task: Calculate total trip fuel cost estimate
- [ ] Task: Calculate savings with recommended stops
- [ ] Task: Document endpoint

### 4.5 Fuel Station Details API
- [ ] Task: Create `/v1/fuel/station/{id}` endpoint
- [ ] Task: Return detailed station information
- [ ] Task: Include all fuel card discounts
- [ ] Task: Include amenity list
- [ ] Task: Document endpoint

### 4.6 Operational API Documentation
- [ ] Task: Write OpenAPI spec for Operational APIs
- [ ] Task: Create code examples
- [ ] Task: Write integration guide for TMS platforms
- [ ] Task: Create Postman collection

### 4.7 Testing - Phase 4
- [ ] Task: Write unit tests for Parking Search API
- [ ] Task: Write unit tests for Fuel Pricing API
- [ ] Task: Write unit tests for Route Planner API
- [ ] Task: Test geo-search accuracy
- [ ] Task: Test fuel card discount calculations
- [ ] Task: Test route planning algorithm
- [ ] Task: Manual test: Full operational API flow
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Operational APIs'

---

## Phase 5: Matching APIs

Expose driver search and carrier matching capabilities.

### 5.1 Driver Search API (Enterprise Only)
- [ ] Task: Create `POST /v1/matching/drivers/search` endpoint
- [ ] Task: Create `externalMatchingApi.jsw` wrapper service
- [ ] Task: Integrate with existing `driverMatching.jsw`
- [ ] Task: Implement CDL class filtering
- [ ] Task: Implement endorsement filtering (must have all)
- [ ] Task: Implement experience filtering
- [ ] Task: Implement location/distance filtering
- [ ] Task: Implement availability filtering
- [ ] Task: Calculate and include match scores
- [ ] Task: Implement PII masking for non-authorized access
- [ ] Task: Implement credit-based usage tracking
- [ ] Task: Enforce Enterprise tier requirement
- [ ] Task: Document endpoint

### 5.2 Driver Profile API
- [ ] Task: Create `/v1/matching/driver/{driver_id}` endpoint
- [ ] Task: Return driver profile (with PII controls)
- [ ] Task: Include qualification summary
- [ ] Task: Implement authorization check (credit consumed)
- [ ] Task: Document endpoint

### 5.3 Carrier Match API
- [ ] Task: Create `POST /v1/matching/carriers` endpoint
- [ ] Task: Integrate with existing `carrierMatching.jsw`
- [ ] Task: Accept driver profile as input
- [ ] Task: Return ranked carrier recommendations
- [ ] Task: Include match score breakdown
- [ ] Task: Optionally include enrichment data
- [ ] Task: Document endpoint

### 5.4 Qualification Check API
- [ ] Task: Create `POST /v1/matching/qualify` endpoint
- [ ] Task: Accept driver qualifications and carrier requirements
- [ ] Task: Return qualification match result
- [ ] Task: Identify missing qualifications
- [ ] Task: Document endpoint

### 5.5 Matching API Documentation
- [ ] Task: Write OpenAPI spec for Matching APIs
- [ ] Task: Create code examples for staffing agency integration
- [ ] Task: Write integration guide
- [ ] Task: Create Postman collection

### 5.6 Testing - Phase 5
- [ ] Task: Write unit tests for Driver Search API
- [ ] Task: Write unit tests for Carrier Match API
- [ ] Task: Test tier enforcement (Enterprise only)
- [ ] Task: Test PII masking
- [ ] Task: Test credit tracking
- [ ] Task: Manual test: Full matching API flow
- [ ] Task: Conductor - User Manual Verification 'Phase 5: Matching APIs'

---

## Phase 6: Document APIs

Expose CDL OCR extraction and document verification capabilities.

### 6.1 CDL Extraction API
- [ ] Task: Create `POST /v1/documents/cdl/extract` endpoint
- [ ] Task: Create `externalDocumentApi.jsw` wrapper service
- [ ] Task: Integrate with existing `ocrService.jsw`
- [ ] Task: Implement file upload handling (multipart/form-data)
- [ ] Task: Accept base64 encoded images as alternative
- [ ] Task: Implement file size limits (10MB max)
- [ ] Task: Implement supported format validation (JPEG, PNG, PDF)
- [ ] Task: Format extraction result for external schema
- [ ] Task: Include verification status (format, state, expiration)
- [ ] Task: Implement extraction credit tracking
- [ ] Task: Document endpoint

### 6.2 Medical Certificate Extraction API
- [ ] Task: Create `POST /v1/documents/medcert/extract` endpoint
- [ ] Task: Implement medical certificate OCR
- [ ] Task: Extract examiner registry number
- [ ] Task: Validate certificate expiration
- [ ] Task: Document endpoint

### 6.3 Document Verification API
- [ ] Task: Create `POST /v1/documents/verify` endpoint
- [ ] Task: Accept previously extracted document ID
- [ ] Task: Perform additional verification checks
- [ ] Task: Return verification result with confidence
- [ ] Task: Document endpoint

### 6.4 Batch Document Processing API
- [ ] Task: Create `POST /v1/documents/batch` endpoint
- [ ] Task: Accept multiple documents for processing
- [ ] Task: Implement async processing with webhook callback
- [ ] Task: Return batch job ID for status checking
- [ ] Task: Create `/v1/documents/batch/{job_id}` status endpoint
- [ ] Task: Document batch processing flow

### 6.5 Document API Documentation
- [ ] Task: Write OpenAPI spec for Document APIs
- [ ] Task: Create code examples for HR integration
- [ ] Task: Write integration guide for background check systems
- [ ] Task: Create Postman collection

### 6.6 Testing - Phase 6
- [ ] Task: Write unit tests for CDL extraction endpoint
- [ ] Task: Write unit tests for medical cert extraction
- [ ] Task: Test file upload handling
- [ ] Task: Test extraction accuracy with sample documents
- [ ] Task: Test batch processing flow
- [ ] Task: Manual test: Full document API flow
- [ ] Task: Conductor - User Manual Verification 'Phase 6: Document APIs'

---

## Phase 7: Engagement APIs (Gamification White-Label)

Expose gamification system for partner integration.

### 7.1 User Progress API
- [ ] Task: Create `/v1/engagement/user/{user_id}/progress` endpoint
- [ ] Task: Create `externalEngagementApi.jsw` wrapper service
- [ ] Task: Integrate with gamification services
- [ ] Task: Return progression data (level, XP, streaks)
- [ ] Task: Return earned badges and achievements
- [ ] Task: Implement partner-scoped user mapping
- [ ] Task: Document endpoint

### 7.2 XP Award API
- [ ] Task: Create `POST /v1/engagement/xp/award` endpoint
- [ ] Task: Allow partners to award XP for custom actions
- [ ] Task: Validate action types and XP amounts
- [ ] Task: Implement daily caps to prevent abuse
- [ ] Task: Trigger level-up checks
- [ ] Task: Document endpoint

### 7.3 Achievement Check API
- [ ] Task: Create `POST /v1/engagement/achievements/check` endpoint
- [ ] Task: Allow partners to trigger achievement checks
- [ ] Task: Return newly earned achievements
- [ ] Task: Document endpoint

### 7.4 Leaderboard API
- [ ] Task: Create `/v1/engagement/leaderboard` endpoint
- [ ] Task: Return leaderboard rankings
- [ ] Task: Support filtering by period (weekly, monthly)
- [ ] Task: Support filtering by type
- [ ] Task: Document endpoint

### 7.5 Engagement Webhooks
- [ ] Task: Create `POST /v1/engagement/webhooks/subscribe` endpoint
- [ ] Task: Implement achievement event webhooks
- [ ] Task: Implement level-up event webhooks
- [ ] Task: Implement streak milestone webhooks
- [ ] Task: Document webhook payloads

### 7.6 Engagement API Documentation
- [ ] Task: Write OpenAPI spec for Engagement APIs
- [ ] Task: Create white-label integration guide
- [ ] Task: Document partner-scoped user mapping
- [ ] Task: Create Postman collection

### 7.7 Testing - Phase 7
- [ ] Task: Write unit tests for Progress API
- [ ] Task: Write unit tests for XP Award API
- [ ] Task: Test achievement webhook delivery
- [ ] Task: Test level-up triggers
- [ ] Task: Manual test: Full engagement API flow
- [ ] Task: Conductor - User Manual Verification 'Phase 7: Engagement APIs'

---

## Phase 8: Developer Portal & Partner Management

Build self-service developer portal and partner management tools.

### 8.1 Developer Portal - Backend
- [ ] Task: Create `apiPortalService.jsw` for portal operations
- [ ] Task: Implement partner registration flow
- [ ] Task: Implement API key management (create, rotate, revoke)
- [ ] Task: Implement usage dashboard data aggregation
- [ ] Task: Implement billing history retrieval
- [ ] Task: Implement webhook testing endpoint
- [ ] Task: Implement sandbox environment switching

### 8.2 Developer Portal - Frontend
- [ ] Task: Create `API_PORTAL_DASHBOARD.html` in `src/public/admin/`
- [ ] Task: Build dashboard with usage stats
- [ ] Task: Build API key management UI
- [ ] Task: Build usage charts (daily, monthly)
- [ ] Task: Build endpoint-level usage breakdown
- [ ] Task: Build webhook management UI
- [ ] Task: Build sandbox/production environment toggle
- [ ] Task: Style with LMDR theme

### 8.3 API Documentation Site
- [ ] Task: Create interactive API documentation page
- [ ] Task: Implement "Try It" feature with sandbox
- [ ] Task: Create code examples in multiple languages
- [ ] Task: Build changelog page
- [ ] Task: Create status page for API health
- [ ] Task: Implement search functionality

### 8.4 Billing Integration
- [ ] Task: Create Stripe products for API tiers
- [ ] Task: Implement subscription checkout flow
- [ ] Task: Implement usage-based billing calculation
- [ ] Task: Implement overage invoice generation
- [ ] Task: Create billing portal link for partners
- [ ] Task: Implement subscription upgrade/downgrade
- [ ] Task: Create billing webhooks for subscription events

### 8.5 Admin Tools
- [ ] Task: Create `ADMIN_API_PARTNERS.html` for partner management
- [ ] Task: Build partner list with status and usage
- [ ] Task: Build partner detail view with full history
- [ ] Task: Implement manual tier override capability
- [ ] Task: Implement partner suspension capability
- [ ] Task: Build usage analytics dashboard
- [ ] Task: Build revenue reporting

### 8.6 Partner Onboarding
- [ ] Task: Create partner onboarding email sequence
- [ ] Task: Create "Getting Started" documentation
- [ ] Task: Create onboarding checklist in portal
- [ ] Task: Implement first API call tracking
- [ ] Task: Create automated onboarding follow-ups

### 8.7 SDK Development
- [ ] Task: Create JavaScript/Node.js SDK (`@lmdr/api-client`)
- [ ] Task: Create Python SDK (`lmdr-python`)
- [ ] Task: Create SDK documentation
- [ ] Task: Publish SDKs to npm and PyPI
- [ ] Task: Create SDK code examples

### 8.8 Testing - Phase 8
- [ ] Task: Test partner registration flow
- [ ] Task: Test API key management
- [ ] Task: Test billing integration
- [ ] Task: Test SDK functionality
- [ ] Task: Test portal responsiveness
- [ ] Task: Manual test: Full partner onboarding flow
- [ ] Task: Conductor - User Manual Verification 'Phase 8: Developer Portal'

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
