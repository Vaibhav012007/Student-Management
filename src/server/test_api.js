const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testRegistration() {
  try {
    console.log('Testing user registration...');
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }, {
      name: 'Test User 4',
      email: 'test4@example.com',
      password: 'password123'
    });

    console.log('Registration response:', registerResponse.status, registerResponse.data);

    if (registerResponse.status === 201) {
      console.log('✓ Registration successful');

      // Test login
      console.log('Testing user login...');
      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 4000,
        path: '/api/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }, {
        email: 'test4@example.com',
        password: 'password123'
      });

      console.log('Login response:', loginResponse.status, loginResponse.data);

      if (loginResponse.status === 200) {
        console.log('✓ Login successful');
        const token = loginResponse.data.token;

        // Test creating a note
        console.log('Testing note creation...');
        const noteResponse = await makeRequest({
          hostname: 'localhost',
          port: 4000,
          path: '/api/notes',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }, {
          title: 'Test Note',
          subject: 'Computer Science',
          content: 'This is a test note to verify backend persistence.',
          createdAt: new Date().toISOString()
        });

        console.log('Create note response:', noteResponse.status, noteResponse.data);

        if (noteResponse.status === 200) {
          console.log('✓ Note creation successful');

          // Test fetching notes
          console.log('Testing note retrieval...');
          const getNotesResponse = await makeRequest({
            hostname: 'localhost',
            port: 4000,
            path: '/api/notes',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log('Get notes response:', getNotesResponse.status, getNotesResponse.data);

          if (getNotesResponse.status === 200 && Array.isArray(getNotesResponse.data) && getNotesResponse.data.length > 0) {
            console.log('✓ Note retrieval successful - backend is updating and persisting data!');
          } else {
            console.log('✗ Note retrieval failed');
          }
        } else {
          console.log('✗ Note creation failed');
        }
      } else {
        console.log('✗ Login failed');
      }
    } else {
      console.log('✗ Registration failed');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRegistration();