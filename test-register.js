// test-register.js
const fetch = require('node-fetch');

async function testRegister() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123'
      })
    });

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    
    if (response.ok) {
      console.log('✅ Register works!');
    } else {
      console.log('❌ Register failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testRegister();