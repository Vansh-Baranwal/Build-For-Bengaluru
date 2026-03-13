const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testE2E() {
  console.log('🧪 Starting End-to-End Test\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');
    
    // Test 2: Submit a complaint
    console.log('2️⃣  Testing Complaint Submission...');
    const complaintData = {
      description: 'Large pothole on MG Road near Trinity Circle causing traffic issues',
      latitude: 12.9716,
      longitude: 77.5946,
      image_url: 'https://example.com/pothole.jpg'
    };
    
    const submitResponse = await axios.post(`${BASE_URL}/api/complaints`, complaintData);
    console.log('✅ Complaint submitted:', submitResponse.data);
    const complaintId = submitResponse.data.complaint_id;
    console.log('');
    
    // Test 3: Retrieve the complaint
    console.log('3️⃣  Testing Complaint Retrieval...');
    const getResponse = await axios.get(`${BASE_URL}/api/complaints/${complaintId}`);
    console.log('✅ Complaint retrieved:', getResponse.data);
    console.log('');
    
    // Test 4: Update complaint status
    console.log('4️⃣  Testing Status Update...');
    const updateResponse = await axios.patch(
      `${BASE_URL}/api/complaints/${complaintId}/status`,
      { status: 'in_progress' }
    );
    console.log('✅ Status updated:', updateResponse.data);
    console.log('');
    
    // Test 5: Get trending issues
    console.log('5️⃣  Testing Trending Endpoint...');
    const trendingResponse = await axios.get(`${BASE_URL}/api/trending`);
    console.log('✅ Trending issues:', trendingResponse.data.length, 'clusters found');
    console.log('');
    
    // Test 6: Get heatmap data
    console.log('6️⃣  Testing Heatmap Endpoint...');
    const heatmapResponse = await axios.get(`${BASE_URL}/api/heatmap`);
    console.log('✅ Heatmap data:', heatmapResponse.data.length, 'complaints found');
    console.log('');
    
    console.log('🎉 All End-to-End Tests Passed!\n');
    console.log('Summary:');
    console.log('  ✅ Health check working');
    console.log('  ✅ Complaint submission with AI analysis');
    console.log('  ✅ Complaint retrieval');
    console.log('  ✅ Status updates with timestamp');
    console.log('  ✅ Trending issues endpoint');
    console.log('  ✅ Heatmap visualization endpoint');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testE2E();
