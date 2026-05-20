const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../skinbook.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
     db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Users table creation error:', err);
      else {
         db.run(`
          INSERT OR IGNORE INTO users (id, username, email) 
          VALUES (1, 'SkincareEnthusiast', 'skincare@example.com')
        `);
      }
    });

     db.run(`
      CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        skinType TEXT NOT NULL,
        description TEXT,
        steps TEXT,
        category TEXT,
        difficulty INTEGER,
        points INTEGER DEFAULT 0,
        userId INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Table creation error:', err);
      } else {
        console.log('✅ Database and relationships initialized successfully');
        
         db.get("SELECT COUNT(*) as count FROM routines", (err, row) => {
          if (!err && row && row.count === 0) {
            const stmt = db.prepare(`
              INSERT INTO routines (name, skinType, description, steps, category, difficulty, points, userId)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
              "Hydrating Morning Routine", 
              "dry", 
              "A gentle morning routine designed to lock in moisture and protect the skin barrier all day long.", 
              "1. Gentle water cleanse\n2. Apply Hyaluronic Acid on damp skin\n3. Apply Ceramide moisturizer\n4. Finish with SPF 50+ sunscreen", 
              "morning", 
              2, 
              150, 
              1
            );
            
            stmt.run(
              "Oily & Acne-Prone Clearing Routine", 
              "oily", 
              "Focused on sebum control, minimizing pores, and preventing breakouts without stripping the skin.", 
              "1. Salicylic Acid Cleanser\n2. Niacinamide Serum\n3. Oil-free Gel Moisturizer\n4. Lightweight Mattifying Sunscreen", 
              "morning", 
              3, 
              200, 
              1
            );
            
            stmt.run(
              "Nighttime Anti-Aging & Recovery", 
              "combination", 
              "Overnight rejuvenation routine using Retinol to boost collagen and repair skin cells.", 
              "1. Double cleanse (oil cleanser + water cleanser)\n2. Wait to dry, then apply 0.2% Retinol\n3. Wait 10 mins, apply rich Peptide night cream", 
              "night", 
              4, 
              300, 
              1
            );
            
            stmt.run(
              "Sensitive Skin Soothing Ritual", 
              "sensitive", 
              "Extremely minimal routine focused on calming redness and irritation with Centella Asiatica.", 
              "1. pH-balanced milk cleanser\n2. Centella Asiatica calming toner\n3. Soothing barrier cream", 
              "night", 
              1, 
              100, 
              1
            );
            
            stmt.finalize();
            console.log('🌱 Default skincare routines successfully seeded into database!');
          }
        });
      }
    });
  });
}

const dbPromise = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
};

module.exports = { db, dbPromise };