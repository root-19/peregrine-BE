import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const apiKey = process.env.FIREBASE_API_KEY;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

if (!projectId) {
  throw new Error('FIREBASE_PROJECT_ID is required in environment variables');
}

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Helper to convert Firestore document fields to plain object
function fromFirestoreFields(fields: any): any {
  const result: any = {};
  for (const key of Object.keys(fields)) {
    result[key] = fromFirestoreValue(fields[key]);
  }
  return result;
}

function fromFirestoreValue(value: any): any {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.nullValue !== undefined) return null;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    return fromFirestoreFields(value.mapValue.fields || {});
  }
  return null;
}

// Helper to convert plain object to Firestore fields
function toFirestoreFields(data: any): any {
  const fields: any = {};
  for (const key of Object.keys(data)) {
    fields[key] = toFirestoreValue(data[key]);
  }
  return fields;
}

function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: value.toString() };
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestoreFields(value) } };
  }
  return { stringValue: String(value) };
}

// Extract document ID from full path
function extractId(name: string): string {
  const parts = name.split('/');
  return parts[parts.length - 1];
}

// Firestore DB wrapper (mimics basic Firestore operations via REST)
class FirestoreCollection {
  constructor(private collectionName: string) {}

  async add(data: any): Promise<{ id: string; data: () => any }> {
    const url = `${FIRESTORE_BASE}/${this.collectionName}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Firestore add error: ${err}`);
    }
    const doc: any = await res.json();
    const id = extractId(doc.name);
    const docData = fromFirestoreFields(doc.fields || {});
    return {
      id,
      data: () => docData,
    };
  }

  doc(id: string): FirestoreDoc {
    return new FirestoreDoc(this.collectionName, id);
  }

  async get(): Promise<{ docs: Array<{ id: string; data: () => any; exists: boolean }> }> {
    const url = `${FIRESTORE_BASE}/${this.collectionName}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Firestore get error: ${err}`);
    }
    const result: any = await res.json();
    const documents = result.documents || [];
    return {
      docs: documents.map((doc: any) => ({
        id: extractId(doc.name),
        data: () => fromFirestoreFields(doc.fields || {}),
        exists: true,
      })),
    };
  }

  // Simple query support
  where(field: string, op: string, value: any): FirestoreQuery {
    return new FirestoreQuery(this.collectionName, [{ field, op, value }]);
  }

  orderBy(field: string, direction: string = 'desc'): FirestoreQuery {
    return new FirestoreQuery(this.collectionName, [], [{ field, direction }]);
  }
}

class FirestoreDoc {
  constructor(private collectionName: string, private docId: string) {}

  async get(): Promise<{ id: string; exists: boolean; data: () => any }> {
    const url = `${FIRESTORE_BASE}/${this.collectionName}/${this.docId}`;
    const res = await fetch(url);
    if (res.status === 404) {
      return { id: this.docId, exists: false, data: () => null };
    }
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Firestore doc get error: ${err}`);
    }
    const doc: any = await res.json();
    return {
      id: this.docId,
      exists: true,
      data: () => fromFirestoreFields(doc.fields || {}),
    };
  }

  async update(data: any): Promise<void> {
    const fieldPaths = Object.keys(data).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `${FIRESTORE_BASE}/${this.collectionName}/${this.docId}?${fieldPaths}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Firestore update error: ${err}`);
    }
  }

  async delete(): Promise<void> {
    const url = `${FIRESTORE_BASE}/${this.collectionName}/${this.docId}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Firestore delete error: ${err}`);
    }
  }
}

class FirestoreQuery {
  private filters: Array<{ field: string; op: string; value: any }>;
  private orders: Array<{ field: string; direction: string }>;
  private limitCount: number | null = null;

  constructor(
    private collectionName: string,
    filters: Array<{ field: string; op: string; value: any }> = [],
    orders: Array<{ field: string; direction: string }> = []
  ) {
    this.filters = filters;
    this.orders = orders;
  }

  where(field: string, op: string, value: any): FirestoreQuery {
    this.filters.push({ field, op, value });
    return this;
  }

  orderBy(field: string, direction: string = 'desc'): FirestoreQuery {
    this.orders.push({ field, direction });
    return this;
  }

  limit(count: number): FirestoreQuery {
    this.limitCount = count;
    return this;
  }

  async get(): Promise<{ empty: boolean; docs: Array<{ id: string; data: () => any; exists: boolean }> }> {
    const opMap: any = {
      '==': 'EQUAL',
      '<': 'LESS_THAN',
      '<=': 'LESS_THAN_OR_EQUAL',
      '>': 'GREATER_THAN',
      '>=': 'GREATER_THAN_OR_EQUAL',
      '!=': 'NOT_EQUAL',
    };

    const structuredQuery: any = {
      from: [{ collectionId: this.collectionName }],
    };

    if (this.filters.length > 0) {
      if (this.filters.length === 1) {
        const f = this.filters[0];
        structuredQuery.where = {
          fieldFilter: {
            field: { fieldPath: f.field },
            op: opMap[f.op] || 'EQUAL',
            value: toFirestoreValue(f.value),
          },
        };
      } else {
        structuredQuery.where = {
          compositeFilter: {
            op: 'AND',
            filters: this.filters.map(f => ({
              fieldFilter: {
                field: { fieldPath: f.field },
                op: opMap[f.op] || 'EQUAL',
                value: toFirestoreValue(f.value),
              },
            })),
          },
        };
      }
    }

    if (this.orders.length > 0) {
      structuredQuery.orderBy = this.orders.map(o => ({
        field: { fieldPath: o.field },
        direction: o.direction === 'asc' ? 'ASCENDING' : 'DESCENDING',
      }));
    }

    if (this.limitCount) {
      structuredQuery.limit = this.limitCount;
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Firestore query error: ${err}`);
    }

    const results = (await res.json()) as any[];
    const docs = results
      .filter((r: any) => r.document)
      .map((r: any) => ({
        id: extractId(r.document.name),
        data: () => fromFirestoreFields(r.document.fields || {}),
        exists: true,
      }));

    return { empty: docs.length === 0, docs };
  }
}

// Main DB object that mimics Firestore interface
class FirestoreDB {
  collection(name: string): FirestoreCollection & { where: (field: string, op: string, value: any) => FirestoreQuery; orderBy: (field: string, direction?: string) => FirestoreQuery } {
    const col = new FirestoreCollection(name);
    const wrapper = Object.assign(col, {
      where: (field: string, op: string, value: any) => {
        return new FirestoreQuery(name, [{ field, op, value }]);
      },
      orderBy: (field: string, direction: string = 'desc') => {
        return new FirestoreQuery(name, [], [{ field, direction }]);
      },
    });
    return wrapper;
  }
}

export const db = new FirestoreDB();
export const STORAGE_BUCKET = storageBucket;

export default db;
