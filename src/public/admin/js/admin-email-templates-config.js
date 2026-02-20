/* =========================================
   ADMIN EMAIL TEMPLATES — Config Module
   No dependencies
   ========================================= */
var EmailTemplatesConfig = (function () {
  'use strict';

  var CATEGORY_COLORS = {
    onboarding: 'bg-violet-500/20 text-violet-400',
    transactional: 'bg-blue-500/20 text-blue-400',
    notification: 'bg-amber-500/20 text-amber-400',
    marketing: 'bg-emerald-500/20 text-emerald-400'
  };

  var DEFAULT_CATEGORY_COLOR = 'bg-slate-500/20 text-slate-400';

  var MOCK_PREVIEW_DATA = {
    'user.firstName': 'John',
    'carrier.name': 'Swift Transport',
    'carrier.dot': '123456',
    'match.score': '92',
    'match.reason': 'Highly recommended based on your route preferences and pay requirements.',
    'platform.url': 'https://www.lastmiledr.app',
    'date.today': new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  };

  var QUILL_TOOLBAR = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ];

  function getCategoryColor(cat) {
    return CATEGORY_COLORS[cat] || DEFAULT_CATEGORY_COLOR;
  }

  return {
    MOCK_PREVIEW_DATA: MOCK_PREVIEW_DATA,
    QUILL_TOOLBAR: QUILL_TOOLBAR,
    getCategoryColor: getCategoryColor
  };
})();
