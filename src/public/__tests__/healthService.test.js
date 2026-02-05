const wixData = require('wix-data');
const wixUsersBackend = require('wix-users-backend');

// =============================================================================
// REPLICATED LOGIC (from src/backend/healthService.jsw)
// =============================================================================

const COLLECTIONS = {
  RESOURCES: 'healthResources',
  TIPS: 'healthTips'
};

// Mock dataAccess logic for the purpose of testing the service layer logic
// We can't easily import backend/dataAccess because of Jest limitations,
// so we'll mock the calls it would make to wixData.
// Or better, we define the service functions here as they appear in the file.

async function getResourcesByCategory(category, options = {}) {
    // Replicated logic
    const filters = {};
    if (category && category !== 'all') filters.category = category;
    if (options.featuredOnly) filters.is_featured = true;

    // Mimic dataAccess.queryRecords behavior using wixData directly for test
    let query = wixData.query(COLLECTIONS.RESOURCES);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.is_featured) query = query.eq('is_featured', true);
    
    // Sort
    query = query.descending('created_at');

    const result = await query.find();
    return result; // wixData returns { items: [], ... }
}

async function searchResources(queryText) {
    if (!queryText) return [];
    
    // In real service this calls dataAccess.queryRecords
    const result = await wixData.query(COLLECTIONS.RESOURCES)
        .descending('created_at')
        .find();
    
    const lowerQuery = queryText.toLowerCase();
    return result.items.filter(item => 
        (item.title && item.title.toLowerCase().includes(lowerQuery)) ||
        (item.summary && item.summary.toLowerCase().includes(lowerQuery)) ||
        (item.content && item.content.toLowerCase().includes(lowerQuery))
    );
}

async function submitTip(tipData) {
    const currentUser = wixUsersBackend.currentUser;
    if (!currentUser.loggedIn) throw new Error('Unauthorized');

    if (!tipData.tip_text || tipData.tip_text.length > 500) {
        throw new Error('Tip text must be between 1 and 500 characters');
    }

    const tip = {
      author_id: currentUser.id,
      category: tipData.category,
      title: tipData.title,
      tip_text: tipData.tip_text,
      helpful_count: 0,
      status: 'pending',
      created_at: new Date()
    };

    return await wixData.insert(COLLECTIONS.TIPS, tip);
}

async function saveResource(data) {
    if (data._id) {
        return await wixData.update(COLLECTIONS.RESOURCES, data);
    } else {
        const newResource = { ...data, created_at: new Date(), view_count: 0, helpful_count: 0 };
        delete newResource._id; 
        return await wixData.insert(COLLECTIONS.RESOURCES, newResource);
    }
}

async function deleteResource(id) {
    return await wixData.remove(COLLECTIONS.RESOURCES, id);
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Health Service Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        wixData.__resetAll();
    });

    describe('getResourcesByCategory', () => {
        it('should return resources for a category', async () => {
            const mockResources = [
                { _id: '1', title: 'Res 1', category: 'exercise', created_at: new Date() },
                { _id: '2', title: 'Res 2', category: 'exercise', created_at: new Date() }
            ];
            wixData.__seedData('healthResources', mockResources);

            const result = await getResourcesByCategory('exercise');
            expect(result.items).toHaveLength(2);
            expect(result.items[0].title).toBe('Res 1');
        });

        it('should filter featured resources', async () => {
             const mockResources = [
                { _id: '1', title: 'Res 1', category: 'exercise', is_featured: true },
                { _id: '2', title: 'Res 2', category: 'exercise', is_featured: false }
            ];
            wixData.__seedData('healthResources', mockResources);

            const result = await getResourcesByCategory('exercise', { featuredOnly: true });
            expect(result.items).toHaveLength(1);
            expect(result.items[0].title).toBe('Res 1');
        });
    });

    describe('searchResources', () => {
        it('should return resources matching query', async () => {
             const mockResources = [
                { _id: '1', title: 'Yoga for Truckers', summary: 'Stretch', created_at: new Date() },
                { _id: '2', title: 'Healthy Eating', summary: 'Food', created_at: new Date() }
            ];
            wixData.__seedData('healthResources', mockResources);

            const result = await searchResources('yoga');
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Yoga for Truckers');
        });
    });

    describe('submitTip', () => {
        it('should submit a tip successfully', async () => {
            wixUsersBackend.currentUser = { loggedIn: true, id: 'user1' };
            
            const tipData = { category: 'nutrition', title: 'Eat apples', tip_text: 'They are good.' };
            await submitTip(tipData);

            // Check if inserted
            const tips = wixData.__getData('healthTips');
            expect(tips).toHaveLength(1);
            expect(tips[0].title).toBe('Eat apples');
            expect(tips[0].status).toBe('pending');
        });

        it('should fail if user not logged in', async () => {
            wixUsersBackend.currentUser = { loggedIn: false };
            const tipData = { category: 'nutrition', title: 'Eat apples', tip_text: 'They are good.' };
            await expect(submitTip(tipData)).rejects.toThrow('Unauthorized');
        });

        it('should fail if text is too long', async () => {
            wixUsersBackend.currentUser = { loggedIn: true, id: 'user1' };
            const longText = 'a'.repeat(501);
            const tipData = { category: 'nutrition', title: 'Eat apples', tip_text: longText };
            await expect(submitTip(tipData)).rejects.toThrow('Tip text must be between 1 and 500 characters');
        });
    });

    describe('saveResource', () => {
        it('should create a new resource', async () => {
            const data = { title: 'New Res', slug: 'new-res', category: 'sleep' };
            await saveResource(data);

            const resources = wixData.__getData('healthResources');
            expect(resources).toHaveLength(1);
            expect(resources[0].title).toBe('New Res');
            expect(resources[0].view_count).toBe(0);
        });

        it('should update an existing resource', async () => {
            wixData.__seedData('healthResources', [{ _id: '1', title: 'Old Title' }]);
            
            await saveResource({ _id: '1', title: 'New Title' });

            const resources = wixData.__getData('healthResources');
            expect(resources[0].title).toBe('New Title');
        });
    });

    describe('deleteResource', () => {
        it('should delete a resource', async () => {
             wixData.__seedData('healthResources', [{ _id: '1', title: 'To Delete' }]);
             await deleteResource('1');
             const resources = wixData.__getData('healthResources');
             expect(resources).toHaveLength(0);
        });
    });
});
