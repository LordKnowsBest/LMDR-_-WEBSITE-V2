/* =========================================
   DRIVER DOCUMENT UPLOAD — Config Module
   No dependencies
   ========================================= */
var DocUploadConfig = (function () {
  'use strict';

  var MESSAGE_REGISTRY = {
    inbound: [
      'initDocumentUpload',
      'documentList',
      'uploadResult',
      'verificationUpdate'
    ],
    outbound: [
      'documentUploadReady',
      'uploadDocument',
      'requestDocumentList'
    ]
  };

  var HELP_CONTENT = {
    mvr: {
      title: 'How to Get Your MVR (Motor Vehicle Record)',
      content: '<div class="space-y-4">' +
        '<p class="text-slate-600">Your MVR shows your driving history for the past 3-10 years, depending on your state.</p>' +
        '<div class="bg-blue-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-lmdr-dark mb-2"><i class="fas fa-map-marker-alt mr-2"></i>Request from Your State DMV</h4>' +
          '<p class="text-sm text-slate-600">Visit your state\'s DMV website or office. Most states allow online requests for a fee of $5-20.</p>' +
        '</div>' +
        '<div class="bg-green-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-lmdr-dark mb-2"><i class="fas fa-clock mr-2"></i>Processing Time</h4>' +
          '<p class="text-sm text-slate-600">Online: Usually instant to 3 business days. In-person: Same day.</p>' +
        '</div>' +
        '<div class="mt-4 p-4 border border-slate-200 rounded-lg">' +
          '<h4 class="font-bold text-sm text-slate-700 mb-2">Common State Links:</h4>' +
          '<ul class="text-sm text-lmdr-blue space-y-1">' +
            '<li><i class="fas fa-external-link-alt mr-2"></i>Texas: txdps.state.tx.us</li>' +
            '<li><i class="fas fa-external-link-alt mr-2"></i>California: dmv.ca.gov</li>' +
            '<li><i class="fas fa-external-link-alt mr-2"></i>Florida: flhsmv.gov</li>' +
          '</ul>' +
        '</div>' +
      '</div>'
    },
    psp: {
      title: 'How to Get Your PSP Report',
      content: '<div class="space-y-4">' +
        '<p class="text-slate-600">Your PSP (Pre-Employment Screening Program) report shows your FMCSA safety record.</p>' +
        '<div class="bg-blue-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-lmdr-dark mb-2"><i class="fas fa-globe mr-2"></i>Official FMCSA Website</h4>' +
          '<p class="text-sm text-slate-600">Visit <strong>psp.fmcsa.dot.gov</strong> to request your report.</p>' +
        '</div>' +
        '<div class="bg-amber-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-lmdr-dark mb-2"><i class="fas fa-dollar-sign mr-2"></i>Cost</h4>' +
          '<p class="text-sm text-slate-600">~$10 per report. You\'ll need a credit/debit card.</p>' +
        '</div>' +
        '<div class="bg-green-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-lmdr-dark mb-2"><i class="fas fa-file-download mr-2"></i>Delivery</h4>' +
          '<p class="text-sm text-slate-600">Your report is available for instant download after payment.</p>' +
        '</div>' +
      '</div>'
    },
    medical: {
      title: 'DOT Medical Card Information',
      content: '<div class="space-y-4">' +
        '<p class="text-slate-600">Your DOT Medical Examiner\'s Certificate is required to drive a CMV.</p>' +
        '<div class="bg-blue-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-lmdr-dark mb-2"><i class="fas fa-user-md mr-2"></i>Find a Certified Medical Examiner</h4>' +
          '<p class="text-sm text-slate-600">Use FMCSA\'s National Registry: <strong>nationalregistry.fmcsa.dot.gov</strong></p>' +
        '</div>' +
        '<div class="bg-green-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-lmdr-dark mb-2"><i class="fas fa-calendar-check mr-2"></i>Validity</h4>' +
          '<p class="text-sm text-slate-600">Cards are valid for up to 2 years, depending on your health conditions.</p>' +
        '</div>' +
        '<div class="bg-amber-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-lmdr-dark mb-2"><i class="fas fa-clipboard-list mr-2"></i>What to Bring</h4>' +
          '<ul class="text-sm text-slate-600 list-disc list-inside">' +
            '<li>Photo ID</li>' +
            '<li>List of current medications</li>' +
            '<li>Glasses/contacts if you wear them</li>' +
            '<li>Previous medical card (if renewing)</li>' +
          '</ul>' +
        '</div>' +
      '</div>'
    },
    cdl: {
      title: 'CDL Photo Tips',
      content: '<div class="space-y-4">' +
        '<p class="text-slate-600">For fast verification, upload clear photos of both sides of your CDL.</p>' +
        '<div class="bg-green-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-green-700 mb-2"><i class="fas fa-check mr-2"></i>Do This</h4>' +
          '<ul class="text-sm text-slate-600 space-y-1">' +
            '<li><i class="fas fa-check text-green-500 mr-2"></i>Use good lighting</li>' +
            '<li><i class="fas fa-check text-green-500 mr-2"></i>Capture the entire card</li>' +
            '<li><i class="fas fa-check text-green-500 mr-2"></i>Keep the camera steady</li>' +
            '<li><i class="fas fa-check text-green-500 mr-2"></i>Make sure text is readable</li>' +
          '</ul>' +
        '</div>' +
        '<div class="bg-red-50 rounded-lg p-4">' +
          '<h4 class="font-bold text-red-700 mb-2"><i class="fas fa-times mr-2"></i>Don\'t Do This</h4>' +
          '<ul class="text-sm text-slate-600 space-y-1">' +
            '<li><i class="fas fa-times text-red-500 mr-2"></i>Blurry or dark photos</li>' +
            '<li><i class="fas fa-times text-red-500 mr-2"></i>Cropped edges</li>' +
            '<li><i class="fas fa-times text-red-500 mr-2"></i>Glare covering text</li>' +
            '<li><i class="fas fa-times text-red-500 mr-2"></i>Expired CDL</li>' +
          '</ul>' +
        '</div>' +
      '</div>'
    }
  };

  var VALID_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  var MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  var STATUS_CONFIGS = {
    requested: {
      label: 'Pending',
      pillClass: 'status-pending',
      icon: 'fas fa-clock',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    uploaded: {
      label: 'Uploaded',
      pillClass: 'status-uploaded',
      icon: 'fas fa-hourglass-half',
      iconBg: 'bg-blue-100',
      iconColor: 'text-lmdr-blue'
    },
    verified: {
      label: 'Verified',
      pillClass: 'status-verified',
      icon: 'fas fa-check-circle',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    rejected: {
      label: 'Rejected',
      pillClass: 'status-rejected',
      icon: 'fas fa-times-circle',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    }
  };

  return {
    MESSAGE_REGISTRY: MESSAGE_REGISTRY,
    HELP_CONTENT: HELP_CONTENT,
    VALID_FILE_TYPES: VALID_FILE_TYPES,
    MAX_FILE_SIZE: MAX_FILE_SIZE,
    STATUS_CONFIGS: STATUS_CONFIGS
  };
})();
