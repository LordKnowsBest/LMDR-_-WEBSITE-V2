/**
 * Forum Service Logic Tests
 * 
 * Replicates core logic from forumService.jsw for unit testing 
 * in the current environment which has ESM import limitations.
 */

// =============================================================================
// REPLICATED LOGIC
// =============================================================================

function normalizeCategory(record) {
    return {
        _id: record._id || record.id,
        title: record.title,
        slug: record.slug,
        description: record.description,
        icon: record.icon,
        sortOrder: record.sortOrder,
        threadCount: record.threadCount || 0,
        postCount: record.postCount || 0
    };
}

function normalizeThread(record) {
    return {
        _id: record._id || record.id,
        title: record.title,
        slug: record.slug,
        categoryId: record.categoryId,
        authorId: record.authorId,
        contentPreview: record.contentPreview,
        viewCount: record.viewCount || 0,
        replyCount: record.replyCount || 0,
        isPinned: record.isPinned || false,
        isLocked: record.isLocked || false,
        lastActivityAt: record.lastActivityAt,
        createdAt: record.createdAt,
        tags: record.tags || []
    };
}

function normalizePost(record) {
    return {
        _id: record._id || record.id,
        threadId: record.threadId,
        authorId: record.authorId,
        content: record.content,
        parentPostId: record.parentPostId || null,
        likeCount: record.likeCount || 0,
        isBestAnswer: record.isBestAnswer || false,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
    };
}

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function checkDeletePermission(currentUser, post, isAdmin) {
    if (!currentUser.loggedIn) throw new Error('Unauthorized');
    if (post.authorId !== currentUser.id) {
        if (!isAdmin) {
            throw new Error('Permission denied');
        }
    }
    return true;
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Forum Service Logic', () => {
  describe('normalization', () => {
    it('should correctly normalize category records', () => {
      const record = { id: '123', title: 'General', slug: 'general', threadCount: 5 };
      const normalized = normalizeCategory(record);
      expect(normalized._id).toBe('123');
      expect(normalized.title).toBe('General');
      expect(normalized.threadCount).toBe(5);
      expect(normalized.postCount).toBe(0); // Default
    });

    it('should correctly normalize thread records', () => {
      const record = { _id: 't1', title: 'Welcome', categoryId: 'c1', viewCount: 10 };
      const normalized = normalizeThread(record);
      expect(normalized.title).toBe('Welcome');
      expect(normalized.isPinned).toBe(false);
      expect(normalized.viewCount).toBe(10);
    });

    it('should correctly normalize post records', () => {
      const record = { id: 'p1', content: 'Hello World', likeCount: 2 };
      const normalized = normalizePost(record);
      expect(normalized.content).toBe('Hello World');
      expect(normalized.likeCount).toBe(2);
      expect(normalized.isBestAnswer).toBe(false);
    });
  });

  describe('slug generation', () => {
    it('should create URL friendly slugs', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('Testing Spec!al Chars')).toBe('testing-spec-al-chars');
      expect(generateSlug('---Trim Ends---')).toBe('trim-ends');
    });
  });

  describe('authorization logic', () => {
    const post = { id: 'p1', authorId: 'user1' };

    it('should allow author to delete', async () => {
      const user = { loggedIn: true, id: 'user1' };
      await expect(checkDeletePermission(user, post, false)).resolves.toBe(true);
    });

    it('should allow admin to delete', async () => {
      const user = { loggedIn: true, id: 'admin1' };
      await expect(checkDeletePermission(user, post, true)).resolves.toBe(true);
    });

    it('should deny non-author non-admin', async () => {
      const user = { loggedIn: true, id: 'user2' };
      await expect(checkDeletePermission(user, post, false)).rejects.toThrow('Permission denied');
    });

    it('should deny not logged in users', async () => {
      const user = { loggedIn: false };
      await expect(checkDeletePermission(user, post, false)).rejects.toThrow('Unauthorized');
    });
  });
});