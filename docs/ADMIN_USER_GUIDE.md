# LMDR Admin Portal - User Guide

## Overview
The LMDR Admin Portal is the central hub for managing the matching platform, monitoring system performance, and configuring platform-wide settings.

## Modules

### 1. Dashboard
- **KPI Cards**: Real-time metrics for active drivers, carrier matches, and system health.
- **Activity Feed**: Live stream of system events (registrations, matches, admin actions).
- **AI Queue**: Monitor the status of AI enrichment batches.

### 2. User Management
- **Drivers**: View, verify, suspend, or message drivers. Bulk actions supported.
- **Carriers**: Monitor carrier enrichment status, safety ratings, and flag issues.

### 3. Compliance Center
- **FMCSA Alerts**: Automatic detection of safety rating changes or out-of-service anomalies.
- **DQF Dashboard**: Track Driver Qualification File completeness across the fleet.

### 4. Platform Configuration
- **Matching Weights**: Fine-tune the algorithms for both driver-to-carrier and carrier-to-driver matching.
- **System Settings**: Configure cache TTLs, batch sizes for background jobs, and API rate limits.
- **Tier Limits**: Manage quotas for Free, Pro, and Enterprise accounts.
- **Maintenance Mode**: Enable a read-only state for the platform during updates.
- **Announcement Banner**: Configure global site-wide notifications.

### 5. Analytics & Reporting
- **Match Analytics**: Visualize match volume and geographic trends.
- **Custom Reports**: Generate CSV exports for audit logs or compliance data.
- **Scheduled Reports**: Configure automated reports to be generated daily, weekly, or monthly.

## Troubleshooting
- **Job Failures**: If a background job fails, check the "Jobs" tab in Platform Configuration to see the last error message and trigger a manual retry.
- **Data Freshness**: Dashboard data is cached for 5 minutes. Use the refresh button to force a live update.
- **API Limits**: If FMCSA lookups are slow, verify the rate limits in System Settings.

## Permissions
- **Admin**: Standard access to user management and dashboard.
- **Super Admin**: Full access including platform configuration and scheduled reports.
- **Ops Admin**: Focus on compliance and moderation tasks.
