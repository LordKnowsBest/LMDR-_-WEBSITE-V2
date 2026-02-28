# v2_Social Credentials — Airtable Schema

**Base:** Last Mile Driver recruiting (`app9N1YCJ3gdhExA0`)
**Table ID:** `tblWJwR3EgOtAnMhX`
**Config Key:** `socialCredentials`
**Created:** 2026-02-28

## Purpose

Stores recruiter-entered API credentials for social platforms (Facebook, Instagram, LinkedIn).
One record per platform per carrier. Credentials are entered manually by the recruiter via
`ros-view-social-settings.js` and saved through `socialSecretService.jsw → dataAccess`.

## Fields

| Field Name | Type | Notes |
|------------|------|-------|
| `platform` | Single line text | `'facebook'` \| `'instagram'` \| `'linkedin'` |
| `carrier_dot` | Single line text | DOT number of the carrier/recruiter |
| `app_id` | Single line text | Meta App ID (Facebook/Instagram only) |
| `app_secret` | Single line text | Meta App Secret (Facebook/Instagram only) |
| `page_id` | Single line text | Facebook Page ID (Facebook only) |
| `page_token` | Single line text | Long-lived Page Access Token (Facebook/Instagram) |
| `ig_user_id` | Single line text | Instagram Business Account ID (Instagram only) |
| `client_id` | Single line text | LinkedIn App Client ID (LinkedIn only) |
| `client_secret` | Single line text | LinkedIn App Client Secret (LinkedIn only) |
| `access_token` | Single line text | OAuth 2.0 Access Token (LinkedIn only) |
| `org_urn` | Single line text | LinkedIn Organization URN, e.g. `urn:li:organization:XXXXXXX` |
| `updated_at` | Date | Last saved timestamp (`YYYY-MM-DD`) |

## Upsert Key

Records are unique on `(platform, carrier_dot)`. `saveCredentials()` queries by both
fields before deciding to insert or update.

## Service

- **Backend:** `src/backend/socialSecretService.jsw`
  - `saveCredentials(platform, credentials)` — upsert one record
  - `getCredentialStatus(platform, carrierDot)` — returns `{ status: 'connected' | 'unconfigured' }`
- **Frontend:** `src/public/recruiter/os/js/views/ros-view-social-settings.js`
- **Page code handler:** `Recruiter Console.zriuj.js` → cases `saveSocialCredentials`, `getSocialCredentialStatus`, `testSocialConnection`

## Platform → Field Mapping

| Platform | Fields Used |
|----------|------------|
| facebook | `platform`, `carrier_dot`, `app_id`, `app_secret`, `page_id`, `page_token`, `updated_at` |
| instagram | `platform`, `carrier_dot`, `ig_user_id`, `updated_at` |
| linkedin | `platform`, `carrier_dot`, `client_id`, `client_secret`, `access_token`, `org_urn`, `updated_at` |

Fields not applicable to a platform are saved as empty strings (`''`).
