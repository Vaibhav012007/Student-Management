const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { authenticateToken, generateToken } = require('./auth');
const router = express.Router();

// Authentication routes (no auth required)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Check if user already exists
    db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (row) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const id = Date.now().toString();
      const createdAt = new Date().toISOString();

      // Create user
      db.run(`
        INSERT INTO users (id, name, email, password, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `, [id, name, email, hashedPassword, createdAt], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const token = generateToken({ id, name, email });
        res.status(201).json({
          user: { id, name, email, createdAt },
          token
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });
  });
});

// Protected routes (require authentication)
router.use(authenticateToken);

// GET notes
router.get('/notes', (req, res) => {
  db.all('SELECT * FROM notes WHERE userId = ? ORDER BY createdAt DESC', [req.user.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST note
router.post('/notes', (req, res) => {
  const { title, subject, content, type, pdfData, pdfName, createdAt } = req.body;
  const id = Date.now().toString();

  db.run(`
    INSERT INTO notes (id, userId, title, subject, content, createdAt, type, pdfData, pdfName)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, req.user.id, title, subject, content, createdAt, type, pdfData, pdfName], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id, title, subject, content, createdAt, type, pdfData, pdfName });
  });
});

// PUT note
router.put('/notes/:id', (req, res) => {
  const { title, subject, content } = req.body;
  const { id } = req.params;

  db.run(`
    UPDATE notes SET title = ?, subject = ?, content = ? WHERE id = ? AND userId = ?
  `, [title, subject, content, id, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true });
  });
});

// DELETE note
router.delete('/notes/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM notes WHERE id = ? AND userId = ?', [id, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true });
  });
});

// GET checklist
router.get('/checklist', (req, res) => {
  db.all('SELECT * FROM checklist WHERE userId = ? ORDER BY createdAt DESC', [req.user.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST checklist item
router.post('/checklist', (req, res) => {
  const { topic, completed, createdAt } = req.body;
  const id = Date.now().toString();

  db.run(`
    INSERT INTO checklist (id, userId, topic, completed, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `, [id, req.user.id, topic, completed ? 1 : 0, createdAt], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id, topic, completed, createdAt });
  });
});

// PUT checklist item
router.put('/checklist/:id', (req, res) => {
  const { topic, completed } = req.body;
  const { id } = req.params;

  db.run(`
    UPDATE checklist SET topic = ?, completed = ? WHERE id = ? AND userId = ?
  `, [topic, completed ? 1 : 0, id, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }
    res.json({ success: true });
  });
});

// DELETE checklist item
router.delete('/checklist/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM checklist WHERE id = ? AND userId = ?', [id, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }
    res.json({ success: true });
  });
});

// GET exams
router.get('/exams', (req, res) => {
  db.all('SELECT * FROM exams WHERE userId = ? ORDER BY date ASC', [req.user.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST exam
router.post('/exams', (req, res) => {
  const { title, subject, date, type } = req.body;
  const id = Date.now().toString();

  db.run(`
    INSERT INTO exams (id, userId, title, subject, date, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, req.user.id, title, subject, date, type], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id, title, subject, date, type });
  });
});

// PUT exam
router.put('/exams/:id', (req, res) => {
  const { title, subject, date, type } = req.body;
  const { id } = req.params;

  db.run(`
    UPDATE exams SET title = ?, subject = ?, date = ?, type = ? WHERE id = ? AND userId = ?
  `, [title, subject, date, type, id, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    res.json({ success: true });
  });
});

// DELETE exam
router.delete('/exams/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM exams WHERE id = ? AND userId = ?', [id, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    res.json({ success: true });
  });
});

// GET study plan
router.get('/study-plan', (req, res) => {
  db.all('SELECT * FROM study_plan WHERE userId = ? ORDER BY priority DESC, order_index ASC', [req.user.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST study plan item
router.post('/study-plan', (req, res) => {
  const { topic, subject, priority, estimatedHours, order } = req.body;
  const id = Date.now().toString();

  db.run(`
    INSERT INTO study_plan (id, userId, topic, subject, priority, estimatedHours, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id, req.user.id, topic, subject, priority, estimatedHours, order || 0], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id, topic, subject, priority, estimatedHours, order: order || 0 });
  });
});

// PUT study plan item
router.put('/study-plan/:id', (req, res) => {
  const { topic, subject, priority, estimatedHours } = req.body;
  const { id } = req.params;

  db.run(`
    UPDATE study_plan SET topic = ?, subject = ?, priority = ?, estimatedHours = ? WHERE id = ? AND userId = ?
  `, [topic, subject, priority, estimatedHours, id, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Study plan item not found' });
    }
    res.json({ success: true });
  });
});

// DELETE study plan item
router.delete('/study-plan/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM study_plan WHERE id = ? AND userId = ?', [id, req.user.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Study plan item not found' });
    }
    res.json({ success: true });
  });
});

// GET timer state
router.get('/timer-state', (req, res) => {
  db.get('SELECT * FROM timer_state WHERE userId = ?', [req.user.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json({
        minutes: row.minutes,
        seconds: row.seconds,
        isRunning: row.isRunning === 1,
        customMinutes: row.customMinutes,
        lastUpdate: row.lastUpdate,
        timerName: row.timerName
      });
    } else {
      // Create default timer state for user
      const defaultState = {
        id: req.user.id,
        userId: req.user.id,
        minutes: 25,
        seconds: 0,
        isRunning: 0,
        customMinutes: 25,
        lastUpdate: 0,
        timerName: 'Focus Session'
      };

      db.run(`
        INSERT INTO timer_state (id, userId, minutes, seconds, isRunning, customMinutes, lastUpdate, timerName)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [defaultState.id, defaultState.userId, defaultState.minutes, defaultState.seconds, defaultState.isRunning, defaultState.customMinutes, defaultState.lastUpdate, defaultState.timerName], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({
          minutes: 25,
          seconds: 0,
          isRunning: false,
          customMinutes: 25,
          lastUpdate: 0,
          timerName: 'Focus Session'
        });
      });
    }
  });
});

// PUT timer state
router.put('/timer-state', (req, res) => {
  const { minutes, seconds, isRunning, customMinutes, lastUpdate, timerName } = req.body;

  db.run(`
    INSERT OR REPLACE INTO timer_state (id, userId, minutes, seconds, isRunning, customMinutes, lastUpdate, timerName)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [req.user.id, req.user.id, minutes, seconds, isRunning ? 1 : 0, customMinutes, lastUpdate, timerName], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

module.exports = router;