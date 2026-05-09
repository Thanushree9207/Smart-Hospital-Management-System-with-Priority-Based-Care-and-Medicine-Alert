import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Initialize Database
  const db = new Database('hospital.db');
  db.pragma('journal_mode = WAL');

  // Create Tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      phone TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS discharged_patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      name TEXT,
      discharge_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      appointment_date DATE NOT NULL,
      severity INTEGER DEFAULT 1, -- 1 to 5
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_name TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      expiry_date DATE NOT NULL
    );
  `);

  // Migration: Ensure 'status' column exists in 'patients'
  try {
    const tableInfo = db.prepare("PRAGMA table_info(patients)").all();
    const hasStatus = tableInfo.some((col: any) => col.name === 'status');
    if (!hasStatus) {
      db.prepare("ALTER TABLE patients ADD COLUMN status TEXT DEFAULT 'Active'").run();
      console.log("Migration: Added 'status' column to 'patients' table.");
    }
  } catch (err) {
    console.error("Migration error:", err);
  }

  // Initial Data (Seed)
  const doctorCount = (db.prepare('SELECT COUNT(*) as count FROM doctors').get() as { count: number }).count;
  const patientCount = (db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number }).count;

  if (doctorCount === 0) {
    const insertDoctor = db.prepare('INSERT INTO doctors (name, specialization, phone) VALUES (?, ?, ?)');
    insertDoctor.run('Dr. Sarah Chen', 'Cardiology', '555-0101');
    insertDoctor.run('Dr. Marcus Wright', 'Neurology', '555-0102');
    insertDoctor.run('Dr. Elena Rodriguez', 'Pediatrics', '555-0103');
    insertDoctor.run('Dr. James Wilson', 'Orthopedics', '555-0104');
    insertDoctor.run('Dr. David Miller', 'Dermatology', '555-0105');
    insertDoctor.run('Dr. Sophia Brown', 'Oncology', '555-0106');
    insertDoctor.run('Dr. Robert Taylor', 'Endocrinology', '555-0107');
    insertDoctor.run('Dr. Linda Martinez', 'Gastroenterology', '555-0108');
    insertDoctor.run('Dr. Michael Garcia', 'Urology', '555-0109');
    insertDoctor.run('Dr. Barbara Wilson', 'Psychiatry', '555-0110');
  }

  if (patientCount < 150) {
    console.log("Seeding realistic dataset (200 patients)...");
    
    // Clear existing to ensure fresh dataset
    db.prepare('DELETE FROM appointments').run();
    db.prepare('DELETE FROM patients').run();
    
    const baseNames = [
      "Liam Smith", "Olivia Johnson", "Noah Williams", "Emma Brown", "Oliver Jones", 
      "Ava Garcia", "Elijah Miller", "Sophia Davis", "William Rodriguez", "Isabella Martinez",
      "James Hernandez", "Mia Lopez", "Benjamin Gonzalez", "Charlotte Wilson", "Lucas Anderson",
      "Amelia Thomas", "Henry Taylor", "Harper Moore", "Alexander Jackson", "Evelyn Martin",
      "Sebastian Lee", "Abigail Perez", "Jack Thompson", "Emily White", "Owen Harris",
      "Elizabeth Sanchez", "Samuel Clark", "Sofia Ramirez", "Mason Lewis", "Avery Robinson",
      "Michael Walker", "Scarlet Young", "Daniel Allen", "Madison King", "Jacob Wright",
      "Layla Scott", "Logan Torres", "Victoria Nguyen", "Jackson Hill", "Aria Flores",
      "Levi Green", "Chloe Adams", "David Nelson", "Camila Baker", "Joseph Hall",
      "Penelope Rivera", "Carter Campbell", "Luna Mitchell", "Wyatt Carter", "Grace Roberts",
      "John Gomez", "Mila Phillips", "Ezra Evans", "Eleanor Turner", "Luke Diaz",
      "Elizabeth Parker", "Anthony Cruz", "Hazel Edwards", "Isaac Collins", "Zoe Reyes",
      "Dylan Stewart", "Stella Morris", "Gabriel Morales", "Aurora Murphy", "Julian Cook",
      "Natalie Rogers", "Christopher Gutierrez", "Hazel Ortiz", "Joshua Morgan", "Violet Cooper",
      "Andrew Peterson", "Lillian Bailey", "Lincoln Reed", "Maya Kelly", "Mateo Howard",
      "Savannah Ramos", "Ryan Cox", "Claire Ward", "Nathan Richardson", "Bella Watson",
      "Aaron Brooks", "Skylar Chavez", "Charles Wood", "Lucy James", "Thomas Bennett",
      "Anna Gray", "Caleb Mendoza", "Leilani Ruiz", "Josiah Hughes", "Paisley Price",
      "Christian Alvarez", "Audrey Castillo", "Hunter Sanders", "Alexa Patel", "Eli Myers",
      "Brooklyn Long", "Jonathan Ross", "Ivy Foster", "Isaiah Jimenez", "Genesis Powell"
    ];

    // Create 200 names by adding variation
    const patientNames = [...baseNames, ...baseNames.map(name => name + " Jr.")];

    const genders = ['Male', 'Female', 'Other'];
    const insertPatient = db.prepare('INSERT INTO patients (name, age, gender, phone, status) VALUES (?, ?, ?, ?, ?)');
    const insertApp = db.prepare('INSERT INTO appointments (patient_id, doctor_id, appointment_date, severity, status) VALUES (?, ?, ?, ?, ?)');

    // Get doctor IDs for appointments
    const doctorIds = db.prepare('SELECT id FROM doctors LIMIT 10').all().map((d: any) => d.id);

    patientNames.forEach((name, i) => {
      const age = Math.floor(Math.random() * 60) + 18;
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const phone = `555-${Math.floor(1000 + Math.random() * 9000)}`;
      const status = Math.random() > 0.8 ? 'Discharged' : 'Active';
      
      const pResult = insertPatient.run(name, age, gender, phone, status);
      const patientId = pResult.lastInsertRowid;

      // Add 1 appointment per patient
      if (doctorIds.length > 0) {
        const docId = doctorIds[i % doctorIds.length];
        // Ensure variety in severity
        const severity = (i % 5) + 1; 
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 30));
        
        insertApp.run(patientId, docId, date.toISOString().split('T')[0], severity, 'Scheduled');
      }
    });

    const medicineCount = (db.prepare('SELECT COUNT(*) as count FROM inventory').get() as { count: number }).count;
    if (medicineCount === 0) {
      const insertMedicine = db.prepare('INSERT INTO inventory (medicine_name, stock, expiry_date) VALUES (?, ?, ?)');
      insertMedicine.run('Paracetamol', 500, '2026-12-31');
      insertMedicine.run('Amoxicillin', 200, '2026-05-15');
      insertMedicine.run('Ibuprofen', 300, '2027-01-20');
      insertMedicine.run('Lisinopril', 1200, '2027-05-15');
      insertMedicine.run('Metformin', 800, '2026-08-20');
    }
  }

  // --- API Routes ---

  // Patients
  app.get('/api/patients', (req, res) => {
    const patients = db.prepare("SELECT * FROM patients WHERE status = 'Active' ORDER BY created_at DESC").all();
    res.json(patients);
  });

  app.post('/api/patients/:id/discharge', (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as any;
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Update status
    db.prepare("UPDATE patients SET status = 'Discharged' WHERE id = ?").run(id);

    // Archive
    db.prepare('INSERT INTO discharged_patients (patient_id, name, notes) VALUES (?, ?, ?)').run(id, patient.name, notes || '');

    res.json({ success: true });
  });

  app.post('/api/patients', (req, res) => {
    const { name, age, gender, phone } = req.body;
    const result = db.prepare('INSERT INTO patients (name, age, gender, phone) VALUES (?, ?, ?, ?)').run(name, age, gender, phone);
    res.json({ id: result.lastInsertRowid });
  });

  // Doctors
  app.get('/api/doctors', (req, res) => {
    const doctors = db.prepare('SELECT * FROM doctors').all();
    res.json(doctors);
  });

  // Appointments
  app.get('/api/appointments', (req, res) => {
    // Priority queue: order by severity descending (high to low)
    const appointments = db.prepare(`
      SELECT a.*, p.name as patient_name, d.name as doctor_name 
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.severity DESC, a.appointment_date ASC
    `).all();
    res.json(appointments);
  });

  app.post('/api/appointments', (req, res) => {
    const { patient_id, doctor_id, appointment_date, severity } = req.body;
    db.prepare('INSERT INTO appointments (patient_id, doctor_id, appointment_date, severity) VALUES (?, ?, ?, ?)').run(patient_id, doctor_id, appointment_date, severity);
    res.json({ success: true });
  });

  // Inventory
  app.get('/api/inventory', (req, res) => {
    const inventory = db.prepare('SELECT * FROM inventory').all();
    res.json(inventory);
  });

  // Analysis: Doctor Workload
  app.get('/api/analysis/workload', (req, res) => {
    const workload = db.prepare(`
      SELECT d.name, COUNT(a.id) as appointment_count
      FROM doctors d
      LEFT JOIN appointments a ON d.id = a.doctor_id
      GROUP BY d.id, d.name
    `).all();
    res.json(workload);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
