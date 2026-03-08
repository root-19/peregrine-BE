import { db } from '../src/config/supabase';

// Sample material requests data
const materialRequestsData = [
  {
    projectId: '1',
    name: 'Cement Bags',
    quantity: '50',
    unit: 'bags',
    urgency: 'high',
    notes: 'Urgent need for foundation work',
    requestedBy: 'user3',
    requestedByName: 'John Smith',
    status: 'pending',
  },
  {
    projectId: '1',
    name: 'Steel Rebars',
    quantity: '100',
    unit: 'pieces',
    urgency: 'normal',
    notes: 'For structural reinforcement',
    requestedBy: 'user4',
    requestedByName: 'Jane Doe',
    status: 'approved',
  },
  {
    projectId: '2',
    name: 'Concrete Mix',
    quantity: '5',
    unit: 'cubic meters',
    urgency: 'low',
    notes: 'For flooring preparation',
    requestedBy: 'user5',
    requestedByName: 'Mike Johnson',
    status: 'pending',
  },
  {
    projectId: '2',
    name: 'Paint',
    quantity: '20',
    unit: 'gallons',
    urgency: 'normal',
    notes: 'Interior wall painting',
    requestedBy: 'user6',
    requestedByName: 'Sarah Wilson',
    status: 'delivered',
  },
  {
    projectId: '3',
    name: 'Electrical Wires',
    quantity: '500',
    unit: 'meters',
    urgency: 'high',
    notes: 'For electrical installation',
    requestedBy: 'user7',
    requestedByName: 'Tom Brown',
    status: 'pending',
  },
  {
    projectId: '3',
    name: 'PVC Pipes',
    quantity: '30',
    unit: 'pieces',
    urgency: 'normal',
    notes: 'For plumbing system',
    requestedBy: 'user8',
    requestedByName: 'Emily Davis',
    status: 'approved',
  },
];

// Function to create dump data
async function createMaterialRequestsDump() {
  try {
    console.log('🔄 Creating material requests dump data...');
    
    // Add timestamp to each record
    const materialRequestsWithTimestamps = materialRequestsData.map(request => ({
      ...request,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    
    // Insert all material requests into Firestore
    const batch = materialRequestsWithTimestamps.map(async (request) => {
      return await db.collection('material_requests').add(request);
    });
    
    const results = await Promise.all(batch);
    
    console.log('✅ Successfully created material requests dump data:');
    console.log(`📊 Created ${results.length} material requests`);
    console.log('📋 Sample records:');
    results.slice(0, 3).forEach((docRef, index) => {
      const request = materialRequestsWithTimestamps[index];
      console.log(`   ${index + 1}. ${request.name} (${request.quantity} ${request.unit}) - ${request.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the dump script
createMaterialRequestsDump();
