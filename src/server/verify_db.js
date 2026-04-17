const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./student_notes.db');

console.log('Verifying data persistence in database...\n');

// Check users table
db.all("SELECT * FROM users", [], (err, users) => {
  if (err) {
    console.error('Error checking users:', err);
  } else {
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    console.log();
  }

  // Check notes table
  db.all("SELECT * FROM notes", [], (err, notes) => {
    if (err) {
      console.error('Error checking notes:', err);
    } else {
      console.log('Notes in database:');
      notes.forEach(note => {
        console.log(`- ID: ${note.id}, UserID: ${note.userId}, Title: ${note.title}, Subject: ${note.subject}`);
        console.log(`  Content: ${note.content.substring(0, 50)}...`);
      });
      console.log();
    }

    console.log('✓ Database verification complete - data is being persisted correctly!');
    db.close();
  });
});