/* eslint-disable */
/**
 * Mock for wix-data module
 * Used in Jest tests to simulate Wix Data API
 */

// In-memory data store for testing
const mockDataStore = {};

// Helper to get or create collection
const getCollection = (collectionName) => {
  if (!mockDataStore[collectionName]) {
    mockDataStore[collectionName] = [];
  }
  return mockDataStore[collectionName];
};

// Generate mock ID
const generateId = () => `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Query builder mock
class MockQuery {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filters = [];
    this._limit = 50;
    this._skip = 0;
    this._sort = null;
    this._ascending = true;
  }

  eq(field, value) {
    this.filters.push({ type: 'eq', field, value });
    return this;
  }

  ne(field, value) {
    this.filters.push({ type: 'ne', field, value });
    return this;
  }

  gt(field, value) {
    this.filters.push({ type: 'gt', field, value });
    return this;
  }

  ge(field, value) {
    this.filters.push({ type: 'ge', field, value });
    return this;
  }

  lt(field, value) {
    this.filters.push({ type: 'lt', field, value });
    return this;
  }

  le(field, value) {
    this.filters.push({ type: 'le', field, value });
    return this;
  }

  contains(field, value) {
    this.filters.push({ type: 'contains', field, value });
    return this;
  }

  hasSome(field, values) {
    this.filters.push({ type: 'hasSome', field, values });
    return this;
  }

  hasAll(field, values) {
    this.filters.push({ type: 'hasAll', field, values });
    return this;
  }

  limit(num) {
    this._limit = num;
    return this;
  }

  skip(num) {
    this._skip = num;
    return this;
  }

  ascending(field) {
    this._sort = field;
    this._ascending = true;
    return this;
  }

  descending(field) {
    this._sort = field;
    this._ascending = false;
    return this;
  }

  async find(options = {}) {
    let items = [...getCollection(this.collectionName)];

    // Apply filters
    for (const filter of this.filters) {
      items = items.filter(item => {
        const fieldValue = item[filter.field];
        switch (filter.type) {
          case 'eq':
            return fieldValue === filter.value;
          case 'ne':
            return fieldValue !== filter.value;
          case 'gt':
            return fieldValue > filter.value;
          case 'ge':
            return fieldValue >= filter.value;
          case 'lt':
            return fieldValue < filter.value;
          case 'le':
            return fieldValue <= filter.value;
          case 'contains':
            return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'hasSome':
            return Array.isArray(filter.values) && filter.values.includes(fieldValue);
          case 'hasAll':
            return Array.isArray(fieldValue) && filter.values.every(v => fieldValue.includes(v));
          default:
            return true;
        }
      });
    }

    // Apply sort
    if (this._sort) {
      items.sort((a, b) => {
        const aVal = a[this._sort];
        const bVal = b[this._sort];
        if (aVal < bVal) return this._ascending ? -1 : 1;
        if (aVal > bVal) return this._ascending ? 1 : -1;
        return 0;
      });
    }

    // Apply pagination
    const totalCount = items.length;
    items = items.slice(this._skip, this._skip + this._limit);

    return {
      items,
      totalCount,
      length: items.length,
      currentPage: Math.floor(this._skip / this._limit) + 1,
      totalPages: Math.ceil(totalCount / this._limit),
      hasNext: () => this._skip + this._limit < totalCount,
      hasPrev: () => this._skip > 0
    };
  }

  async count(options = {}) {
    const result = await this.find(options);
    return result.totalCount;
  }
}

// Main wixData mock
const wixData = {
  // Query builder
  query: jest.fn((collectionName) => new MockQuery(collectionName)),

  // Insert
  insert: jest.fn(async (collectionName, item, options = {}) => {
    const collection = getCollection(collectionName);
    const newItem = {
      ...item,
      _id: item._id || generateId(),
      _createdDate: new Date(),
      _updatedDate: new Date()
    };
    collection.push(newItem);
    return newItem;
  }),

  // Update
  update: jest.fn(async (collectionName, item, options = {}) => {
    const collection = getCollection(collectionName);
    const index = collection.findIndex(i => i._id === item._id);
    if (index === -1) {
      throw new Error(`Item not found: ${item._id}`);
    }
    const updatedItem = {
      ...collection[index],
      ...item,
      _updatedDate: new Date()
    };
    collection[index] = updatedItem;
    return updatedItem;
  }),

  // Save (insert or update)
  save: jest.fn(async (collectionName, item, options = {}) => {
    const collection = getCollection(collectionName);
    if (item._id) {
      const index = collection.findIndex(i => i._id === item._id);
      if (index !== -1) {
        return wixData.update(collectionName, item, options);
      }
    }
    return wixData.insert(collectionName, item, options);
  }),

  // Get by ID
  get: jest.fn(async (collectionName, itemId, options = {}) => {
    const collection = getCollection(collectionName);
    const item = collection.find(i => i._id === itemId);
    return item || null;
  }),

  // Remove
  remove: jest.fn(async (collectionName, itemId, options = {}) => {
    const collection = getCollection(collectionName);
    const index = collection.findIndex(i => i._id === itemId);
    if (index === -1) {
      throw new Error(`Item not found: ${itemId}`);
    }
    const removed = collection.splice(index, 1)[0];
    return removed;
  }),

  // Bulk insert
  bulkInsert: jest.fn(async (collectionName, items, options = {}) => {
    const results = [];
    for (const item of items) {
      const inserted = await wixData.insert(collectionName, item, options);
      results.push(inserted);
    }
    return { insertedItemIds: results.map(r => r._id), inserted: results.length };
  }),

  // Bulk update
  bulkUpdate: jest.fn(async (collectionName, items, options = {}) => {
    const results = [];
    for (const item of items) {
      const updated = await wixData.update(collectionName, item, options);
      results.push(updated);
    }
    return { updatedItemIds: results.map(r => r._id), updated: results.length };
  }),

  // Bulk remove
  bulkRemove: jest.fn(async (collectionName, itemIds, options = {}) => {
    const results = [];
    for (const id of itemIds) {
      const removed = await wixData.remove(collectionName, id, options);
      results.push(removed);
    }
    return { removedItemIds: results.map(r => r._id), removed: results.length };
  }),

  // Truncate (for testing)
  truncate: jest.fn(async (collectionName, options = {}) => {
    mockDataStore[collectionName] = [];
    return { removed: 0 };
  }),

  // Test helpers (not part of real wix-data)
  __resetAll: () => {
    Object.keys(mockDataStore).forEach(key => {
      delete mockDataStore[key];
    });
  },

  __seedData: (collectionName, items) => {
    mockDataStore[collectionName] = items.map(item => ({
      ...item,
      _id: item._id || generateId(),
      _createdDate: item._createdDate || new Date(),
      _updatedDate: item._updatedDate || new Date()
    }));
  },

  __getData: (collectionName) => {
    return getCollection(collectionName);
  }
};

module.exports = wixData;
