/**
 * Moderation Service Logic Tests
 * 
 * Replicates core logic from moderationService.jsw for unit testing.
 */

// =============================================================================
// REPLICATED LOGIC
// =============================================================================

const PROFANITY_LIST = ['spam', 'scam', 'abuse'];

function autoFilter(content) {
  if (!content) return { isFlagged: false };
  
  const lower = content.toLowerCase();
  
  // Check profanity
  for (const word of PROFANITY_LIST) {
    if (lower.includes(word)) {
      return { isFlagged: true, reason: 'profanity' };
    }
  }

  // Check caps spam (>70% caps and length > 10)
  if (content.length > 10) {
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    if (capsCount / content.length > 0.7) {
       return { isFlagged: true, reason: 'caps_spam' };
    }
  }

  // Check link spam (more than 3 links)
  const linkCount = (content.match(/http/g) || []).length;
  if (linkCount > 3) {
      return { isFlagged: true, reason: 'link_spam' };
  }

  return { isFlagged: false };
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Moderation Service Logic', () => {
  describe('autoFilter', () => {
    it('should flag profanity', () => {
      expect(autoFilter('This is a spam post').isFlagged).toBe(true);
      expect(autoFilter('Testing scam alert').isFlagged).toBe(true);
    });

    it('should flag caps spam', () => {
      const res = autoFilter('THIS CONTENT IS WAY TOO LOUD FOR THE FORUM');
      expect(res.isFlagged).toBe(true);
      expect(res.reason).toBe('caps_spam');
    });

    it('should flag link spam', () => {
      const res = autoFilter('http://link1.com http://link2.com http://link3.com http://link4.com');
      expect(res.isFlagged).toBe(true);
      expect(res.reason).toBe('link_spam');
    });

    it('should pass clean content', () => {
      const res = autoFilter('This is a perfectly normal and polite post about trucks.');
      expect(res.isFlagged).toBe(false);
    });
  });
});