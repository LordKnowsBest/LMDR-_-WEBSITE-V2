// ============================================================================
// LMDR Driver Jobs Dynamic Page - NUMERIC PAYRATE FIX
// Collection: DriverJobs
// Last Updated: December 2025
// ============================================================================

import wixLocation from 'wix-location';
import wixSeo from 'wix-seo';

$w.onReady(async () => {
  console.log('🚀 LMDR Driver Jobs Page Initialized');
  
  $w('#dynamicDataset').onReady(async () => {
    try {
      const item = await $w('#dynamicDataset').getCurrentItem();
      console.log('📦 Raw item data from dataset:', item);
      
      // ========================================================================
      // UTILITY FUNCTIONS
      // ========================================================================
      
      // Safely get field values with fallback - SUPPORTS NUMBER FIELDS
      const getField = (fieldName, defaultValue = '') => {
        const value = item[fieldName];
        if (value === null || value === undefined || value === '') {
          return defaultValue;
        }
        // Convert numbers to strings for consistency
        if (typeof value === 'number') {
          return String(value);
        }
        return value;
      };
      
      // Strip HTML tags from rich text fields
      const stripHtml = (richText) => {
        if (!richText) return '';
        return String(richText).replace(/<[^>]*>/g, '').trim();
      };
      
      // Format phone number consistently
      const formatPhone = (phone) => {
        if (!phone) return '+1-214-531-3751';
        const cleaned = stripHtml(phone).replace(/\D/g, '');
        if (cleaned.length === 10) {
          return `+1-${cleaned.slice(0,3)}-${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
        }
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
          return `+1-${cleaned.slice(1,4)}-${cleaned.slice(4,7)}-${cleaned.slice(7)}`;
        }
        return stripHtml(phone);
      };
      
      // Format date for display
      const formatDate = (dateStr, format = 'display') => {
        if (!dateStr) return null;
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return null;
          
          if (format === 'iso') {
            return date.toISOString();
          }
          if (format === 'display') {
            return date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            });
          }
          if (format === 'relative') {
            const now = new Date();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            return formatDate(dateStr, 'display');
          }
        } catch (e) {
          return null;
        }
      };
      
      // Format postal code
      const formatPostalCode = (code) => {
        if (!code) return '';
        const cleaned = String(code).replace(/\D/g, '');
        return cleaned.padStart(5, '0').slice(0, 5);
      };
      
      // ========================================================================
      // INTELLIGENT FIELD PARSERS - FIXED FOR NUMERIC FIELDS
      // ========================================================================
      
      // Parse CDL class from multiple fields
      const parseCdlClass = () => {
        const title = String(getField('jobTitle')).toLowerCase();
        const driverType = String(getField('driverType')).toLowerCase();
        const description = String(getField('description')).toLowerCase();
        const jobDesc1 = String(getField('jobDescription1')).toLowerCase();
        const combined = `${title} ${driverType} ${description} ${jobDesc1}`;
        
        if (combined.includes('cdl-a') || combined.includes('cdl a') || combined.includes('class a')) {
          return 'Class A';
        }
        if (combined.includes('cdl-b') || combined.includes('cdl b') || combined.includes('class b')) {
          return 'Class B';
        }
        if (combined.includes('non-cdl') || combined.includes('non cdl') || combined.includes('no cdl')) {
          return 'Non-CDL';
        }
        
        // Infer from driver type
        if (driverType.includes('last mile') || driverType.includes('delivery')) {
          return 'Class B / Non-CDL';
        }
        
        return 'Class A'; // Default for OTR/Regional
      };
      
      // Parse home time based on route type and description
      const parseHomeTime = () => {
        const routeType = String(getField('routeType')).toLowerCase();
        const description = String(getField('description')).toLowerCase();
        const benefits = String(getField('benefits')).toLowerCase();
        const combined = `${routeType} ${description} ${benefits}`;
        
        // Check for specific home time mentions
        if (combined.includes('home daily') || combined.includes('daily home')) return 'Home Daily';
        if (combined.includes('home nightly') || combined.includes('every night')) return 'Home Nightly';
        if (combined.includes('home weekly') || combined.includes('weekly home')) return 'Home Weekly';
        if (combined.includes('every weekend')) return 'Weekends Off';
        if (combined.includes('home time')) return 'Flexible Home Time';
        
        // Infer from route type
        if (routeType.includes('local')) return 'Home Daily';
        if (routeType.includes('dedicated')) return 'Home Weekly';
        if (routeType.includes('regional')) return 'Home Weekly';
        if (routeType.includes('otr') || routeType.includes('over the road')) return 'Every 2-3 Weeks';
        
        return 'Varies by Route';
      };
      
      // Parse experience requirements
      const parseExperience = () => {
        const description = String(getField('description')).toLowerCase();
        const jobDesc1 = String(getField('jobDescription1')).toLowerCase();
        const title = String(getField('jobTitle')).toLowerCase();
        const combined = `${description} ${jobDesc1} ${title}`;
        
        // Check for specific experience mentions
        if (combined.includes('no experience') || combined.includes('will train') || combined.includes('training provided')) {
          return 'No Experience Required';
        }
        if (combined.includes('entry level') || combined.includes('recent grad') || combined.includes('new drivers')) {
          return 'Entry Level Welcome';
        }
        if (combined.includes('6 month') || combined.includes('6-month')) return '6+ Months';
        
        // Extract year requirements
        const yearMatch = combined.match(/(\d+)\+?\s*years?/);
        if (yearMatch) {
          return `${yearMatch[1]}+ Years`;
        }
        
        // Extract month requirements
        const monthMatch = combined.match(/(\d+)\+?\s*months?/);
        if (monthMatch) {
          const months = parseInt(monthMatch[1]);
          if (months >= 12) return `${Math.floor(months/12)}+ Years`;
          return `${months}+ Months`;
        }
        
        return '1+ Year Preferred';
      };
      
      // Parse equipment type from description
      const parseEquipmentType = () => {
        const description = String(getField('description')).toLowerCase();
        const jobDesc1 = String(getField('jobDescription1')).toLowerCase();
        const title = String(getField('jobTitle')).toLowerCase();
        const routeType = String(getField('routeType')).toLowerCase();
        const combined = `${description} ${jobDesc1} ${title} ${routeType}`;
        
        const equipmentTypes = [];
        
        if (combined.includes('reefer') || combined.includes('refrigerated')) equipmentTypes.push('Reefer');
        if (combined.includes('flatbed')) equipmentTypes.push('Flatbed');
        if (combined.includes('tanker')) equipmentTypes.push('Tanker');
        if (combined.includes('dry van') || combined.includes('dryvan')) equipmentTypes.push('Dry Van');
        if (combined.includes('box truck')) equipmentTypes.push('Box Truck');
        if (combined.includes('sprinter') || combined.includes('cargo van')) equipmentTypes.push('Cargo Van');
        if (combined.includes('step deck')) equipmentTypes.push('Step Deck');
        if (combined.includes('doubles') || combined.includes('triples')) equipmentTypes.push('Doubles/Triples');
        if (combined.includes('hazmat')) equipmentTypes.push('Hazmat');
        if (combined.includes('intermodal')) equipmentTypes.push('Intermodal');
        
        if (equipmentTypes.length === 0) {
          // Infer from driver type
          const driverType = String(getField('driverType')).toLowerCase();
          if (driverType.includes('last mile')) return 'Box Truck / Cargo Van';
          return 'Dry Van';
        }
        
        return equipmentTypes.slice(0, 2).join(' / ');
      };
      
      // Parse endorsements required
      const parseEndorsements = () => {
        const description = String(getField('description')).toLowerCase();
        const jobDesc1 = String(getField('jobDescription1')).toLowerCase();
        const combined = `${description} ${jobDesc1}`;
        
        const endorsements = [];
        
        if (combined.includes('hazmat') || combined.includes('h endorsement')) endorsements.push('Hazmat (H)');
        if (combined.includes('tanker') || combined.includes('n endorsement')) endorsements.push('Tanker (N)');
        if (combined.includes('doubles') || combined.includes('triples') || combined.includes('t endorsement')) endorsements.push('Doubles/Triples (T)');
        if (combined.includes('passenger') || combined.includes('p endorsement')) endorsements.push('Passenger (P)');
        if (combined.includes('twic')) endorsements.push('TWIC Card');
        
        return endorsements;
      };
      
      // Parse benefits into structured array
      const parseBenefits = () => {
        const benefitsField = getField('benefits');
        const description = String(getField('description')).toLowerCase();
        const jobDesc1 = String(getField('jobDescription1')).toLowerCase();
        const combined = `${description} ${jobDesc1}`;
        
        const parsedBenefits = [];
        
        // Parse from benefits field
        if (benefitsField) {
          const items = String(benefitsField)
            .split(/[\n,•|]/)
            .map(b => b.trim())
            .filter(b => b.length > 3 && b.length < 100);
          parsedBenefits.push(...items);
        }
        
        // Auto-detect benefits from description
        const benefitKeywords = {
          'health insurance': 'Health Insurance',
          'dental': 'Dental Coverage',
          'vision': 'Vision Coverage',
          '401k': '401(k) Retirement Plan',
          '401(k)': '401(k) Retirement Plan',
          'paid time off': 'Paid Time Off',
          'pto': 'Paid Time Off',
          'vacation': 'Paid Vacation',
          'sign-on bonus': 'Sign-On Bonus',
          'sign on bonus': 'Sign-On Bonus',
          'safety bonus': 'Safety Bonus',
          'performance bonus': 'Performance Bonus',
          'fuel bonus': 'Fuel Efficiency Bonus',
          'referral bonus': 'Referral Bonus',
          'direct deposit': 'Weekly Direct Deposit',
          'weekly pay': 'Weekly Pay',
          'rider program': 'Rider Program',
          'pet policy': 'Pet-Friendly',
          'no touch': 'No-Touch Freight',
          'drop and hook': 'Drop & Hook',
          'detention pay': 'Detention Pay',
          'layover pay': 'Layover Pay',
          'breakdown pay': 'Breakdown Pay'
        };
        
        for (const [keyword, benefit] of Object.entries(benefitKeywords)) {
          if (combined.includes(keyword) && !parsedBenefits.includes(benefit)) {
            parsedBenefits.push(benefit);
          }
        }
        
        // Remove duplicates and limit
        return [...new Set(parsedBenefits)].slice(0, 12);
      };
      
      // Parse requirements from description
      const parseRequirements = () => {
        const description = String(getField('description')).toLowerCase();
        const jobDesc1 = String(getField('jobDescription1')).toLowerCase();
        const combined = `${description} ${jobDesc1}`;
        
        const requirements = [];
        
        // Age requirement
        if (combined.includes('21') || combined.includes('twenty-one')) {
          requirements.push('Must be 21 years of age or older');
        } else if (combined.includes('23') || combined.includes('twenty-three')) {
          requirements.push('Must be 23 years of age or older');
        }
        
        // Background checks
        if (combined.includes('background check') || combined.includes('clean record')) {
          requirements.push('Must pass background check');
        }
        
        // Drug screening
        if (combined.includes('drug') || combined.includes('dot physical')) {
          requirements.push('Must pass DOT physical and drug screening');
        }
        
        // Driving record
        if (combined.includes('clean mvr') || combined.includes('driving record')) {
          requirements.push('Clean driving record required');
        }
        if (combined.includes('no dui') || combined.includes('no dwi')) {
          requirements.push('No DUI/DWI convictions');
        }
        
        // Physical requirements
        if (combined.includes('lift') || combined.includes('physical')) {
          const liftMatch = combined.match(/lift\s*(\d+)/);
          if (liftMatch) {
            requirements.push(`Ability to lift up to ${liftMatch[1]} lbs`);
          }
        }
        
        // Work authorization
        if (combined.includes('authorized to work') || combined.includes('work authorization')) {
          requirements.push('Must be authorized to work in the US');
        }
        
        return requirements;
      };
      
      // Parse pay structure - FIXED FOR NUMERIC PAYRATE
      const parsePayStructure = () => {
        const payRateRaw = getField('payRate'); // Could be NUMBER or TEXT
        const payRate = String(payRateRaw); // Convert to string safely
        const description = String(getField('description')).toLowerCase();
        const combined = `${payRate} ${description}`.toLowerCase();
        
        const payInfo = {
          baseRate: payRate || 'Competitive',
          payType: 'weekly',
          bonuses: [],
          avgWeekly: null
        };
        
        // Determine pay type
        if (combined.includes('cpm') || combined.includes('per mile') || combined.includes('¢/mile')) {
          payInfo.payType = 'per mile';
        } else if (combined.includes('/hr') || combined.includes('per hour') || combined.includes('hourly')) {
          payInfo.payType = 'hourly';
        } else if (combined.includes('/year') || combined.includes('annual') || combined.includes('salary')) {
          payInfo.payType = 'annual';
        } else if (combined.includes('/load') || combined.includes('per load')) {
          payInfo.payType = 'per load';
        } else if (combined.includes('percentage') || combined.includes('%')) {
          payInfo.payType = 'percentage';
        }
        
        // Extract bonuses
        const bonusMatch = combined.match(/\$[\d,]+\s*(?:sign[- ]?on|bonus)/gi);
        if (bonusMatch) {
          payInfo.bonuses = bonusMatch.map(b => b.trim());
        }
        
        // Extract average weekly
        const weeklyMatch = combined.match(/\$[\d,]+\s*(?:-\s*\$[\d,]+)?\s*(?:\/?\s*week|weekly)/i);
        if (weeklyMatch) {
          payInfo.avgWeekly = weeklyMatch[0].trim();
        }
        
        return payInfo;
      };
      
      // Normalize pay period display - FIXED FOR NUMERIC PAYRATE
      const normalizePayPeriod = () => {
        const empType = String(getField('employmentType')).toLowerCase();
        const payRateRaw = getField('payRate');
        const payRate = String(payRateRaw).toLowerCase(); // Convert to string FIRST
        const combined = `${empType} ${payRate}`;
        
        if (combined.includes('/hr') || combined.includes('hour')) return 'hour';
        if (combined.includes('cpm') || combined.includes('mile')) return 'mile';
        if (combined.includes('/month') || combined.includes('month')) return 'month';
        if (combined.includes('/year') || combined.includes('annual')) return 'year';
        if (combined.includes('/load') || combined.includes('load')) return 'load';
        return 'week';
      };
      
      // Get company name intelligently
      const getCompanyName = () => {
        const hiringLocation = getField('hiringLocation');
        const companyBase = getField('companyBase');
        
        // Check if hiringLocation looks like a company name (not a location)
        const looksLikeLocation = hiringLocation && (
          hiringLocation.includes(',') || 
          /\b[A-Z]{2}\b/.test(hiringLocation) ||
          /\d{5}/.test(hiringLocation)
        );
        
        if (!looksLikeLocation && hiringLocation && hiringLocation.length > 2) {
          return hiringLocation;
        }
        
        if (companyBase && companyBase.length > 2) {
          return companyBase;
        }
        
        return 'LMDR Carrier Partner';
      };
      
      // Build full address
      const buildFullAddress = () => {
        const parts = [];
        const streetAddress = getField('streetAddress');
        const city = getField('city');
        const state = getField('state');
        const postalCode = getField('postalCode');
        
        if (streetAddress) parts.push(streetAddress);
        if (city) parts.push(city);
        if (state) parts.push(state);
        if (postalCode) parts.push(formatPostalCode(postalCode));
        
        return parts.length > 0 ? parts.join(', ') : null;
      };
      
      // Calculate posting freshness
      const getPostingFreshness = () => {
        const datePosted = getField('datePosted');
        if (!datePosted) return { fresh: true, label: 'New', daysAgo: 0 };
        
        try {
          const posted = new Date(datePosted);
          const now = new Date();
          const daysAgo = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
          
          if (daysAgo <= 1) return { fresh: true, label: 'Just Posted', daysAgo };
          if (daysAgo <= 3) return { fresh: true, label: 'New', daysAgo };
          if (daysAgo <= 7) return { fresh: true, label: 'This Week', daysAgo };
          if (daysAgo <= 14) return { fresh: false, label: '2 Weeks Ago', daysAgo };
          if (daysAgo <= 30) return { fresh: false, label: 'This Month', daysAgo };
          return { fresh: false, label: formatDate(datePosted, 'display'), daysAgo };
        } catch (e) {
          return { fresh: true, label: 'New', daysAgo: 0 };
        }
      };
      
      // Check if job is still valid
      const isJobValid = () => {
        const validThrough = getField('validThrough');
        if (!validThrough) return { valid: true, expiresIn: null };
        
        try {
          const expires = new Date(validThrough);
          const now = new Date();
          const daysUntilExpiry = Math.floor((expires - now) / (1000 * 60 * 60 * 24));
          
          return {
            valid: daysUntilExpiry > 0,
            expiresIn: daysUntilExpiry,
            urgency: daysUntilExpiry <= 3 ? 'high' : daysUntilExpiry <= 7 ? 'medium' : 'low'
          };
        } catch (e) {
          return { valid: true, expiresIn: null };
        }
      };
      
      // ========================================================================
      // BUILD COMPLETE JOB DATA OBJECT
      // ========================================================================
      
      const postingFreshness = getPostingFreshness();
      const jobValidity = isJobValid();
      const payStructure = parsePayStructure();
      const endorsements = parseEndorsements();
      const parsedBenefits = parseBenefits();
      const parsedRequirements = parseRequirements();
      
      const jobData = {
        // ====== HERO SECTION ======
        jobTitle: getField('jobTitle', 'CDL Driver Position'),
        companyName: getCompanyName(),
        driverType: getField('driverType', 'CDL Driver'),
        
        // ====== LOCATION DATA ======
        city: getField('city', 'Various'),
        state: getField('state', 'TX'),
        postalCode: formatPostalCode(getField('postalCode')),
        streetAddress: getField('streetAddress', ''),
        fullAddress: buildFullAddress(),
        hiringLocation: getField('hiringLocation', ''),
        companyBase: getField('companyBase', ''),
        
        // ====== PAY & COMPENSATION ======
        payRate: getField('payRate', 'Competitive'),
        payPeriod: normalizePayPeriod(),
        payStructure: payStructure,
        avgWeeklyPay: payStructure.avgWeekly,
        bonuses: payStructure.bonuses,
        
        // ====== JOB CLASSIFICATION ======
        routeType: getField('routeType', 'OTR'),
        employmentType: getField('employmentType', 'Full-Time'),
        homeTime: parseHomeTime(),
        
        // ====== REQUIREMENTS ======
        cdlClass: parseCdlClass(),
        experienceRequired: parseExperience(),
        equipmentType: parseEquipmentType(),
        endorsements: endorsements,
        endorsementsRequired: endorsements.length > 0,
        
        // ====== JOB DETAILS ======
        description: getField('description', ''),
        jobDescription1: getField('jobDescription1', ''),
        jobDescriptionHtml: getField('jobDescription1') || getField('description') || '<p>Great opportunity for experienced CDL drivers looking for their next career move.</p>',
        jobDescriptionPlain: stripHtml(getField('jobDescription1') || getField('description')),
        
        // ====== BENEFITS ======
        benefits: getField('benefits', ''),
        benefitsList: parsedBenefits,
        hasBenefits: parsedBenefits.length > 0,
        
        // ====== REQUIREMENTS LIST ======
        requirementsList: parsedRequirements,
        
        // ====== MEDIA ======
        companyLogo: getField('companyLogo', ''),
        hasLogo: !!getField('companyLogo'),
        
        // ====== CONTACT INFO ======
        phone: formatPhone(getField('phone')),
        phoneRaw: stripHtml(getField('phone')),
        
        // ====== APPLICATION ======
        applicationLink: getField('applicationLink', 'https://form.jotform.com/250845294380057'),
        hasCustomApplication: !!getField('applicationLink'),
        
        // ====== DATES & TIMING ======
        datePosted: getField('datePosted', ''),
        datePostedFormatted: formatDate(getField('datePosted'), 'display'),
        datePostedRelative: formatDate(getField('datePosted'), 'relative'),
        datePostedIso: formatDate(getField('datePosted'), 'iso'),
        validThrough: getField('validThrough', ''),
        validThroughFormatted: formatDate(getField('validThrough'), 'display'),
        startDate: 'Immediate',
        
        // ====== POSTING STATUS ======
        postingFreshness: postingFreshness,
        isFresh: postingFreshness.fresh,
        freshnessLabel: postingFreshness.label,
        daysAgo: postingFreshness.daysAgo,
        
        // ====== JOB VALIDITY ======
        isValid: jobValidity.valid,
        expiresIn: jobValidity.expiresIn,
        urgency: jobValidity.urgency,
        isUrgent: jobValidity.urgency === 'high' || postingFreshness.daysAgo <= 3,
        
        // ====== SYSTEM FIELDS ======
        _id: item._id,
        _createdDate: item._createdDate,
        _updatedDate: item._updatedDate,
        
        // ====== SEO DATA ======
        seoTitle: `${getField('jobTitle', 'CDL Driver')} - ${getField('city', 'Texas')} | ${getCompanyName()}`,
        seoDescription: `Apply for ${getField('jobTitle', 'CDL Driver')} position in ${getField('city', 'Texas')}, ${getField('state', 'TX')}. ${getField('payRate', 'Competitive pay')}. ${parseHomeTime()}. Apply now through LMDR.`,
        canonicalUrl: wixLocation.url,
        
        // ====== STRUCTURED DATA (JSON-LD) ======
        structuredData: {
          "@context": "https://schema.org/",
          "@type": "JobPosting",
          "title": getField('jobTitle', 'CDL Driver Position'),
          "description": stripHtml(getField('jobDescription1') || getField('description')),
          "identifier": {
            "@type": "PropertyValue",
            "name": "LMDR",
            "value": item._id
          },
          "datePosted": formatDate(getField('datePosted'), 'iso') || new Date().toISOString(),
          "validThrough": formatDate(getField('validThrough'), 'iso') || null,
          "employmentType": getField('employmentType', 'FULL_TIME').toUpperCase().replace(/[- ]/g, '_'),
          "hiringOrganization": {
            "@type": "Organization",
            "name": getCompanyName(),
            "sameAs": "https://lastmiledr.app"
          },
          "jobLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": getField('streetAddress', ''),
              "addressLocality": getField('city', ''),
              "addressRegion": getField('state', ''),
              "postalCode": formatPostalCode(getField('postalCode')),
              "addressCountry": "US"
            }
          },
          "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
              "@type": "QuantitativeValue",
              "value": getField('payRate', ''),
              "unitText": normalizePayPeriod().toUpperCase()
            }
          },
          "occupationalCategory": "53-3032.00",
          "industry": "Transportation and Warehousing",
          "qualifications": parseCdlClass() + " CDL Required",
          "experienceRequirements": parseExperience(),
          "directApply": true
        }
      };
      
      console.log('📤 Complete job data object built:', jobData);
      
      // ========================================================================
      // SET SEO TAGS
      // ========================================================================
      
      try {
        wixSeo.setTitle(jobData.seoTitle);
        wixSeo.setMetaTags([
          { name: 'description', content: jobData.seoDescription },
          { property: 'og:title', content: jobData.seoTitle },
          { property: 'og:description', content: jobData.seoDescription },
          { property: 'og:type', content: 'website' },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'twitter:title', content: jobData.seoTitle },
          { name: 'twitter:description', content: jobData.seoDescription }
        ]);
        
        // Add structured data
        wixSeo.setStructuredData([jobData.structuredData]);
        
        console.log('✅ SEO tags set successfully');
      } catch (seoError) {
        console.error('⚠️ Error setting SEO tags:', seoError);
      }
      
      // ========================================================================
      // SEND DATA TO HTML COMPONENT
      // ========================================================================
      
      setTimeout(() => {
        try {
          const htmlComponent = $w('#html4');
          
          if (htmlComponent.rendered && typeof htmlComponent.postMessage === 'function') {
            htmlComponent.postMessage(jobData);
            console.log('✅ postMessage sent successfully to #html4');
          } else {
            console.error('❌ #html4 not found or no postMessage method');
          }
        } catch (error) {
          console.error('❌ Error sending postMessage:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Error processing dataset item:', error);
    }
  });
});