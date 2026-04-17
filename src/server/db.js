const sqlite3 = require('sqlite3').verbose();

// Create database file
const db = new sqlite3.Database('./student_notes.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables
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
  `);

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
  `);

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
  `);

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
  `);

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
  `);

  // Timer State table
  db.run(`
    CREATE TABLE IF NOT EXISTS timer_state (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      minutes INTEGER DEFAULT 25,
      seconds INTEGER DEFAULT 0,
      isRunning INTEGER DEFAULT 0,
      customMinutes INTEGER DEFAULT 25,
      lastUpdate INTEGER DEFAULT 0,
      timerName TEXT DEFAULT 'Focus Session',
      FOREIGN KEY (userId) REFERENCES users (id)
    )
  `);
});

module.exports = db;