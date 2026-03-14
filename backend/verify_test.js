const fetch = require('node-fetch');

// This script simulates a verification request to the backend
// Since I don't have a valid auth token and complaint ID in this context easily,
// I'll at least verify if the route is no longer returning a 404 (Not Found) 
// but instead returning something else like 401 (Unauthorized) or 400 (Bad Request).

async function testVerifyEndpoint() {
  const complaintId = '547f0efa-4c56-402a-a9aa-2807eefb9e4e'; // ID from the user's error report
  const url = `http://localhost:5000/api/complaints/${complaintId}/verify`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_genuine: true }),
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('Response:', data);

    if (response.status !== 404) {
      console.log('SUCCESS: Endpoint is found (no longer 404).');
    } else {
      console.log('FAILURE: Endpoint still returning 404.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVerifyEndpoint();
