require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function toVal(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return { integerValue: v.toString() };
    return { doubleValue: v };
  }
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toVal) } };
  if (typeof v === 'object') {
    const fields = {};
    for (const k of Object.keys(v)) fields[k] = toVal(v[k]);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function toFields(data) {
  const fields = {};
  for (const k of Object.keys(data)) fields[k] = toVal(data[k]);
  return fields;
}

async function addDoc(collection, data) {
  const url = `${BASE}/${collection}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ Failed to add to ${collection}:`, err);
    return null;
  }
  const doc = await res.json();
  const id = doc.name.split('/').pop();
  console.log(`✅ Added to ${collection}: ${id}`);
  return id;
}

async function addUser() {
  console.log(`\n🔥 Adding user to Firebase Firestore for project: ${PROJECT_ID}\n`);
  const now = new Date().toISOString();

  // Add the new user
  const user = {
    email: 'wasiea1010@peregrine.com',
    password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', // password123 hash
    name: 'David Lee',
    role: 'MANAGER',
    status: 'active',
    department: 'Operations',
    position: 'Site Supervisor',
    hireDate: '2020-09-18',
    phone: '+1234567897',
    about: '',
    profileimage: '',
    created_at: now,
    updated_at: now,
  };

  const userId = await addDoc('users', user);
  
  if (userId) {
    console.log('\n🎉 User added successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`Email: wasiea1010@peregrine.com`);
    console.log(`Password: password123`);
    console.log(`Role: MANAGER`);
    console.log(`Name: David Lee`);
    console.log(`Position: Site Supervisor`);
    console.log(`User ID: ${userId}`);
  } else {
    console.log('❌ Failed to add user');
  }
}

addUser().catch(console.error);
