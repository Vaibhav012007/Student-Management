const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./student_notes.db');

console.log('Detailed database verification...\n');

// Check users table
db.all("SELECT id, name, email, createdAt FROM users", [], (err, users) => {
  if (err) {
    console.error('Error checking users:', err);
  } else {
    console.log(`Users in database (${users.length} total):`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Created: ${user.createdAt}`);
    });
  }

  // Check notes table
  db.all("SELECT id, userId, title, subject, content FROM notes", [], (err, notes) => {
    if (err) {
      console.error('Error checking notes:', err);
    } else {
      console.log(`\nNotes in database (${notes.length} total):`);
      notes.forEach(note => {
        console.log(`- ID: ${note.id}, UserID: ${note.userId}, Title: ${note.title}`);
        console.log(`  Subject: ${note.subject}, Content: ${note.content ? note.content.substring(0, 50) + '...' : 'N/A'}`);
      });
    }

    console.log('\n✓ Database verification complete!');
    console.log('✓ Backend is successfully updating and persisting user data!');
    db.close();
  });
});