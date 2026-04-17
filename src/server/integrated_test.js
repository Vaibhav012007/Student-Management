const http = require('http');
const sqlite3 = require('sqlite3').verbose();

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

async function testAndVerify() {
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
    name: 'Test User 6',
    email: 'test6@example.com',
    password: 'password123'
  });

  console.log('Registration response:', registerResponse.status);

  if (registerResponse.status === 201) {
    console.log('✓ Registration successful');

    const token = registerResponse.data.token;

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

    console.log('Create note response:', noteResponse.status);

    if (noteResponse.status === 200) {
      console.log('✓ Note creation successful');

      // Wait a moment for database operations to complete
      console.log('\nWaiting for database operations to complete...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Now check the database directly
      console.log('Checking database directly...');
      const db = new sqlite3.Database('./student_notes.db');

      db.all("SELECT id, name, email FROM users WHERE email = 'test6@example.com'", [], (err, users) => {
        if (err) {
          console.error('Database error:', err);
        } else {
          console.log(`Users found in database: ${users.length}`);
          users.forEach(user => {
            console.log(`- ${user.name} (${user.email})`);
          });
        }

        db.all("SELECT id, userId, title, subject FROM notes WHERE title = 'Test Note'", [], (err, notes) => {
          if (err) {
            console.error('Database error:', err);
          } else {
            console.log(`Notes found in database: ${notes.length}`);
            notes.forEach(note => {
              console.log(`- "${note.title}" by user ${note.userId}`);
            });
          }

          if (users.length > 0 && notes.length > 0) {
            console.log('\n✅ SUCCESS: Backend is updating and persisting data correctly!');
          } else {
            console.log('\n❌ FAILURE: Data not found in database');
            console.log('Checking all users and notes in database...');

            db.all("SELECT COUNT(*) as count FROM users", [], (err, result) => {
              if (!err) console.log(`Total users in database: ${result[0].count}`);
            });

            db.all("SELECT COUNT(*) as count FROM notes", [], (err, result) => {
              if (!err) console.log(`Total notes in database: ${result[0].count}`);
            });
          }

          db.close();
        });
      });
    } else {
      console.log('✗ Note creation failed');
      console.log('Response:', noteResponse);
    }
  } else {
    console.log('✗ Registration failed');
    console.log('Response:', registerResponse);
  }
}

testAndVerify();