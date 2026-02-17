# Seed Data Agent

Seeds test data into Airtable collections for development and testing.

## Pattern

Follow the existing seed pattern from `src/backend/seeds/seedMockData.jsw`:

```javascript
import * as dataAccess from 'backend/dataAccess';

export async function seedCollection(collectionKey, records) {
  const results = [];
  for (const record of records) {
    try {
      const result = await dataAccess.insertRecord(collectionKey, record, { suppressAuth: true });
      results.push({ success: true, id: result._id });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  return results;
}
```

## Guidelines

- Use `suppressAuth: true` for all backend-initiated operations
- Chunk large batches (10 records at a time, 200ms between chunks)
- Single Select fields need string values ('Yes'/'No'), NOT booleans
- Date fields accept ISO strings (YYYY-MM-DD)
- Text fields reject arrays — use comma-separated strings
