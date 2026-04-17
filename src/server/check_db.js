const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./student_notes.db');

console.log('Manually creating all tables...');

// Create all tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `, (err) => {
    if (err) console.error('Users table error:', err);
    else console.log('✓ Users table created');
  });

  // Notes table
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT,
      createdAt TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      pdfData TEXT,
      pdfName TEXT,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Notes table error:', err);
    else console.log('✓ Notes table created');
  });

  // Checklist table
  db.run(`
    CREATE TABLE IF NOT EXISTS checklist (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      topic TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Checklist table error:', err);
    else console.log('✓ Checklist table created');
  });

  // Exams table
  db.run(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Exams table error:', err);
    else console.log('✓ Exams table created');
  });

  // Study Plan table
  db.run(`
    CREATE TABLE IF NOT EXISTS study_plan (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      topic TEXT NOT NULL,
      subject TEXT NOT NULL,
      priority INTEGER NOT NULL,
      estimatedHours REAL NOT NULL,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Study plan table error:', err);
    else console.log('✓ Study plan table created');
  });

  // Timer State table
  db.run(`
    CREATE TABLE IF NOT EXISTS timer_state (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      minutes INTEGER NOT NULL,
      seconds INTEGER NOT NULL,
      isRunning INTEGER DEFAULT 0,
      customMinutes INTEGER NOT NULL,
      lastUpdate INTEGER NOT NULL,
      timerName TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `, (err) => {
    if (err) console.error('Timer state table error:', err);
    else console.log('✓ Timer state table created');
  });
});

// Check tables after creation
setTimeout(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('\nFinal database tables:');
      rows.forEach(row => {
        console.log('- ' + row.name);
      });
    }
    db.close();
  });
}, 100);