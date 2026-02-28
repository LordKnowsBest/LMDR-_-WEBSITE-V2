# Social Composer Enhancement — Spec

**Track ID:** social_composer_enhancement_20260228
**Created:** 2026-02-28
**Priority:** High
**Status:** Ready to Implement

---

## 1. Overview

### What We're Building

Three connected features that turn the basic social composer into a full-featured content creation suite:

1. **Social Account Settings Panel** (`ros-view-social-settings.js`) — A dedicated settings panel where recruiters input and save their Meta (Facebook/Instagram) and LinkedIn API credentials. Accessible from the "Manage" / "Connect" flows in the social view. Keys are stored via `socialSecretService.jsw` → Wix Secrets.

2. **Platform-Specific AI Copy Generation** — The existing "Generate AI Content" button in the composer calls `aiRouterService.jsw` (Gemini) with platform-aware prompts. Each platform gets a distinct tone, structure, emoji guidance, hashtag rules, and CTA style based on what actually drives engagement.

3. **Imagen Image Generation** — A new image panel in the composer lets the recruiter describe a visual, pick a platform format (by size/ratio), and generate it via Google's Imagen API (using the existing `GEMINI_API_KEY`). The generated image is base64-returned and displayed inline for download/copy.

### Why Now

- "Generate AI Content" button has been a dead stub since the view was built
- "Connect" buttons fire OAuth flows that require API credentials the recruiter has never been asked to provide
- Image generation is table stakes for any social tool in 2026 — text-only posts underperform by 2-3x on all three platforms

---

## 2. Architecture

### Settings Flow

```
Social View "Connect" button
         ↓
ros-view-social-settings.js (new CDN module)
  Renders credential input form per platform
         ↓
ROS.bridge.sendToVelo('saveSocialCredentials', { platform, credentials })
         ↓
Recruiter Console page code → socialSecretService.jsw
  → wix-secrets-backend.set(key, value) per credential
         ↓
sendToHtml(component, 'socialCredentialsSaved', { platform, success })
```

### AI Copy Generation Flow

```
Composer: user writes brief → clicks "Generate AI Content"
         ↓
ROS.bridge.sendToVelo('generateSocialCopy', {
  brief, platform, tone, jobTitle, companyName
})
         ↓
Recruiter Console → generateSocialCopy() (new backend function)
  → aiRouterService.jsw routeRequest('social_copy_generation', prompt)
  → Gemini API (GEMINI_API_KEY already in Secrets)
  → Returns platform-specific copy
         ↓
sendToHtml(component, 'socialCopyGenerated', { copy, platform, hashtags, cta })
```

### Image Generation Flow

```
Composer: user describes image → picks platform format → clicks "Generate Image"
         ↓
ROS.bridge.sendToVelo('generateSocialImage', {
  prompt, platform, format (e.g. '1:1', '4:5', '9:16'),
  style (e.g. 'professional photo', 'illustrated', 'bold graphic')
})
         ↓
Recruiter Console → imagenService.jsw.generateImage(params)
  → POST https://generativelanguage.googleapis.com/v1beta/models/
         gemini-2.0-flash-preview-image-generation:generateContent
  → Returns base64 PNG
         ↓
sendToHtml(component, 'socialImageGenerated', {
  base64, mimeType, platform, format, widthPx, heightPx
})
         ↓
View renders inline preview + "Download" + "Use This" buttons
```

---

## 3. Phase Specifications

### Phase 1: Social Account Settings Panel

**New file:** `src/public/recruiter/os/js/views/ros-view-social-settings.js`

**What it renders:**
- Per-platform credential sections (Facebook, Instagram, LinkedIn)
- Each section has labeled inputs for required keys (see below)
- "Save" button per platform → fires `saveSocialCredentials`
- "Test Connection" button → fires `testSocialConnection` → calls platform API with stored token to verify
- Status chips: "Not configured", "Connected ✓", "Token expired ⚠️"

**Facebook / Instagram (Meta) credential fields:**
| Field | Wix Secret Key | Notes |
|-------|---------------|-------|
| Meta App ID | `META_APP_ID` | From Meta Developer Console |
| Meta App Secret | `META_APP_SECRET` | From Meta Developer Console |
| Page Access Token | `FB_PAGE_TOKEN_{pageId}` | Long-lived (60-day), via Graph Explorer or OAuth |
| Facebook Page ID | `FB_PAGE_ID` | Numeric ID of the Facebook Page |
| Instagram Business Account ID | `IG_USER_ID_{userId}` | From Meta Business Suite |

**LinkedIn credential fields:**
| Field | Wix Secret Key | Notes |
|-------|---------------|-------|
| Client ID | `LINKEDIN_CLIENT_ID` | From LinkedIn Developer App |
| Client Secret | `LINKEDIN_CLIENT_SECRET` | From LinkedIn Developer App |
| Access Token | `LINKEDIN_ACCESS_TOKEN` | OAuth 2.0 token with r_liteprofile + w_member_social |
| Organization URN | `LINKEDIN_ORG_URN` | urn:li:organization:XXXXXXX |

**New page code handlers (in Recruiter Console):**
```javascript
case 'saveSocialCredentials': {
  // calls socialSecretService.saveCredentials(platform, credentials)
}
case 'testSocialConnection': {
  // calls socialTokenService.validateToken(platform, token)
}
case 'getSocialCredentialStatus': {
  // calls socialSecretService.getCredentialStatus(platform)
  // returns { configured: bool, tokenExpiry: date|null }
}
```

**New export in `socialSecretService.jsw`:**
```javascript
export async function saveCredentials(platform, credentials)
export async function getCredentialStatus(platform)
```

**Navigation:** Settings panel is accessed two ways:
1. From `ros-view-social.js` "Connect" button → changes action from `connectSocialAccount` to `openSocialSettings` with `{ platform }`
2. From ROS settings panel → new "API Credentials" row that opens social settings

**Success Criteria:**
- Recruiter can input and save credentials for each platform
- "Test Connection" confirms token is valid before first post
- Credential status is visible (configured vs not) on load

---

### Phase 2: Platform-Specific AI Copy Generation

**New backend file:** `src/backend/socialCopyService.jsw`

**Exported function:**
```javascript
export async function generatePlatformCopy(params) {
  // params: { brief, platform, jobTitle, companyName, tone, carrierDot }
  // Returns: { success, copy, hashtags, cta, charCount }
}
```

**Platform prompts (system prompt per platform):**

*Facebook:*
```
You are a social media copywriter for a CDL truck driver recruiting company.
Write a Facebook post for a recruiter trying to attract CDL drivers.
Tone: Conversational and community-focused. Use storytelling. Ask a question to
encourage comments. Include 1-2 emojis. Keep it under 300 characters.
End with a clear call-to-action (Apply Now / Learn More / Message Us).
Do NOT use hashtags unless the recruiter specifically asks.
```

*Instagram:*
```
You are a social media copywriter for a CDL truck driver recruiting company.
Write an Instagram caption for a recruiter trying to attract CDL drivers.
Tone: Casual, authentic, punchy. Use 3-5 emojis naturally throughout.
Keep the first sentence under 125 characters (shown before "more" cutoff).
Include 8-12 relevant hashtags at the end, separated by line break.
End with: "Link in bio to apply 🔗"
```

*LinkedIn:*
```
You are a social media copywriter for a CDL truck driver recruiting company.
Write a LinkedIn post for a recruiter trying to attract CDL drivers.
Tone: Professional and authoritative. Lead with an industry insight or stat.
Use bullet points or a numbered list if listing benefits.
Include 2-3 professional hashtags inline (e.g. #CDLJobs #TruckingIndustry).
No emojis. End with a professional CTA.
Max 600 characters.
```

**View changes in `ros-view-social.js`:**
- The "Generate AI Content" button now calls `ROS.bridge.sendToVelo('generateSocialCopy', { brief: contentEl.value, platform: selectedPlatform })`
- While generating: button shows spinner, textarea shows "Generating..."
- On `socialCopyGenerated`: populate textarea with returned copy, show hashtag chips below if Instagram
- Character counter updates live per platform limits (Facebook: 63,206 | LinkedIn: 3,000 | Instagram: 2,200)

**New page code handler:**
```javascript
case 'generateSocialCopy': {
  const result = await generatePlatformCopy({
    brief: msg.data?.brief,
    platform: msg.data?.platform,
    jobTitle: msg.data?.jobTitle || '',
    companyName: msg.data?.companyName || currentCarrierName || '',
    carrierDot: currentCarrierDOT
  });
  sendToHtml(component, 'socialCopyGenerated', result);
}
```

**Success Criteria:**
- Clicking "Generate AI Content" with any text in the composer produces platform-appropriate copy
- Facebook copy: conversational, question, no hashtags
- Instagram copy: emojis, hashtags block at end, "Link in bio"
- LinkedIn copy: professional, no emojis, inline hashtags

---

### Phase 3: Imagen Image Generation

**New backend file:** `src/backend/imagenService.jsw`

**Exported function:**
```javascript
export async function generateSocialImage(params) {
  // params: { prompt, platform, aspectRatio, style, carrierDot }
  // Returns: { success, base64, mimeType, widthLabel, aspectRatio }
}
```

**Implementation:**
```javascript
import { getSecret } from 'wix-secrets-backend';

const IMAGE_MODELS = {
  fast: 'gemini-2.0-flash-preview-image-generation',
  quality: 'gemini-2.5-flash-image'
};

export async function generateSocialImage({ prompt, aspectRatio, style }) {
  const apiKey = await getSecret('GEMINI_API_KEY');
  const model = IMAGE_MODELS.fast;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const fullPrompt = buildImagePrompt(prompt, style);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        response_mime_type: 'image/png',
        candidate_count: 1
      }
    })
  });

  const data = await response.json();
  const imageData = data?.candidates?.[0]?.content?.parts?.find(p => p.inline_data);
  if (!imageData) return { success: false, error: 'No image returned' };

  return {
    success: true,
    base64: imageData.inline_data.data,
    mimeType: imageData.inline_data.mime_type,
    aspectRatio
  };
}
```

**Platform Format Config (in `ros-config.js` or `ros-view-social.js`):**
```javascript
const SOCIAL_FORMATS = {
  facebook: [
    { label: 'Feed Square',    ratio: '1:1',    px: '1080×1080', apiRatio: '1:1'  },
    { label: 'Feed Portrait',  ratio: '4:5',    px: '1080×1350', apiRatio: '4:5'  },
    { label: 'Story / Reel',   ratio: '9:16',   px: '1080×1920', apiRatio: '9:16' },
    { label: 'Ad / Link',      ratio: '1.91:1', px: '1200×628',  apiRatio: '16:9' }
  ],
  instagram: [
    { label: 'Feed Square',    ratio: '1:1',    px: '1080×1080', apiRatio: '1:1'  },
    { label: 'Feed Portrait',  ratio: '4:5',    px: '1080×1350', apiRatio: '4:5'  },
    { label: 'Story / Reel',   ratio: '9:16',   px: '1080×1920', apiRatio: '9:16' }
  ],
  linkedin: [
    { label: 'Feed Post',      ratio: '1:1',    px: '1200×1200', apiRatio: '1:1'  },
    { label: 'Link Preview',   ratio: '1.91:1', px: '1200×627',  apiRatio: '16:9' }
  ]
};
```

**Composer UI additions in `ros-view-social.js`:**
- New tab in composer: **"Image"** alongside text area
- Image tab shows:
  - Format picker: grid of cards showing the format options for selected platforms (shows intersection of selected platforms)
  - Text prompt input: "Describe the image you want..."
  - Style selector: "Professional Photo", "Bold Graphic", "Illustrated", "Minimal"
  - "Generate Image" button (gradient purple-fuchsia, matches composer theme)
  - Generated image preview (max 300px wide, preserve aspect ratio)
  - "Download PNG" and "Regenerate" buttons below preview

**New page code handler:**
```javascript
import { generateSocialImage } from 'backend/imagenService';

case 'generateSocialImage': {
  try {
    const result = await generateSocialImage({
      prompt: msg.data?.prompt,
      aspectRatio: msg.data?.aspectRatio || '1:1',
      style: msg.data?.style || 'professional photo',
      carrierDot: currentCarrierDOT
    });
    sendToHtml(component, 'socialImageGenerated', result);
  } catch (err) {
    sendToHtml(component, 'socialImageGenerated', { success: false, error: err.message });
  }
}
```

**Success Criteria:**
- Format picker shows only formats relevant to selected platforms
- Entering a prompt and clicking Generate returns a base64 image
- Image preview renders correctly at correct aspect ratio
- "Download PNG" triggers browser download

---

## 4. Key Design Decisions

### Why a Separate Settings Panel (Not OAuth Popup)

Full OAuth flows require redirect URIs and server-side token exchange — complex and fragile in a Wix iframe context. For V1, recruiters paste their tokens directly (obtained from Meta Business Suite / Graph Explorer). These tokens are long-lived (60 days for Meta, no expiry for LinkedIn org tokens). The settings panel also makes token rotation easy to see and manage.

OAuth flows can be added later as Phase 4 when the recruiter base is larger.

### Why `gemini-2.0-flash-preview-image-generation` (Not Imagen 4)

Imagen 4 requires Vertex AI (GCP project, service account, different auth). The Gemini API endpoint reuses the existing `GEMINI_API_KEY` already in Wix Secrets — zero new infrastructure. If image quality becomes a requirement, upgrading to Vertex AI Imagen 4 is a backend-only change in `imagenService.jsw`.

### Platform Format Intersection

When multiple platforms are selected in the composer, the format picker shows the **intersection** of formats that work for all selected platforms. For example, FB + IG selected → shows `1:1`, `4:5`, `9:16` (all three overlap). This prevents generating a LinkedIn landscape image for an Instagram-only post.

### Character Counter

Each platform has a hard character limit. The composer's live counter turns amber at 80% of the limit and red above 100%. Platform limits:
- Facebook: 63,206 (effectively unlimited, recommended <300)
- Instagram: 2,200
- LinkedIn: 3,000

---

## 5. Files to Create/Modify

### New Files
| File | Type | Purpose |
|------|------|---------|
| `src/public/recruiter/os/js/views/ros-view-social-settings.js` | CDN JS | Account credentials settings panel |
| `src/backend/socialCopyService.jsw` | Backend | Platform-aware AI copy generation |
| `src/backend/imagenService.jsw` | Backend | Imagen API image generation |

### Modified Files
| File | Changes |
|------|---------|
| `src/public/recruiter/os/js/views/ros-view-social.js` | Add image tab to composer, wire generateAI(), platform char counter, hook "Connect" to settings panel |
| `src/backend/socialSecretService.jsw` | Add `saveCredentials()` and `getCredentialStatus()` exports |
| `src/pages/Recruiter Console.zriuj.js` | Add handlers: `generateSocialCopy`, `generateSocialImage`, `saveSocialCredentials`, `testSocialConnection`, `getSocialCredentialStatus` |
| `src/public/recruiter/os/RecruiterOS.html` | Add `<script>` tag for `ros-view-social-settings.js` |

---

## 6. Open Questions

1. Should the settings panel be a separate ROS view (navigated to via `ROS.views.showView('social-settings')`) or a modal overlay within the social view?
2. Should generated images be stored anywhere (Wix Media, Airtable) or just returned inline for the recruiter to download and upload manually to the platform?
3. For copy generation: should we pre-fill the "company name" and "job title" from the recruiter profile automatically, or always ask the recruiter to provide context?
