const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 3000;
const { jsPDF } = require('jspdf'); 
const fs = require('fs');

app.use(session({
  secret: 'home4321', 
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'remidy',
  password: 'home4321',
  port: 5432,
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'med.html'));
});

app.get('/front', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'front1.html'));
});


app.get('/med', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'med.html'));
});

app.get('/patient', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'patient.html'));
});
app.get('/med3', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'med3.html'));
});

app.get('/doctor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'doctor.html'));
});
app.get('/med4', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'med4.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/appointment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'appointment.html'));
});

app.get('/profile', (req, res) => {
  
  if (req.session.userId) {
      res.sendFile(path.join(__dirname, 'public', 'profile.html'));
  } else {
      
      res.redirect('/front');
  }
});
app.get('/dprofile', (req, res) => {
  if (req.session.doctorId) {
    res.sendFile(path.join(__dirname, 'public', 'dprofile.html'));
  } else {
    res.redirect('/front');
  }
});
app.get('/appointment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'appointment.html'));
});

app.get('/blood', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Blood.html'));
});

app.get('/feedback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'feedback.html'));
});

app.get('/individual', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'individual.html'));
});

app.get('/pres', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dpres.html'));
});
app.get('/api/prescription/download', async (req, res) => {
  const userId = req.session.userId; 

  if (!userId) {
    return res.status(401).json({ message: 'User not logged in' });
  }

  try {
    
    const userResult = await pool.query('SELECT first_name, last_name FROM patient_profile WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fullName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`;

    
    const prescriptionResult = await pool.query('SELECT * FROM prescription WHERE name = $1', [fullName]);

    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.json(prescriptionResult.rows[0]); 
  } catch (err) {
    console.error('Error fetching prescription:', err.message);
    res.status(500).json({ message: 'Error fetching prescription' });
  }
});

app.get('/api/get-feedback', async (req, res) => {
  const doctorId = req.session.doctorId;

  if (!doctorId) {
      return res.status(401).json({ success: false, message: 'Doctor not logged in' });
  }

  try {
      // Get doctor name from doctor_profile using doctorId
      const doctorResult = await pool.query('SELECT first_name, last_name FROM doctor_profile WHERE id = $1', [doctorId]);

      if (doctorResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Doctor not found' });
      }

      const doctorName = `${doctorResult.rows[0].first_name} ${doctorResult.rows[0].last_name}`;

      // Query feedback table using doctor's name
      const feedbackResult = await pool.query('SELECT rating, comment FROM feedback WHERE name = $1', [doctorName]);

      if (feedbackResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'No feedback found for this doctor' });
      }

      // Return feedback data
      res.json({
          success: true,
          rating: feedbackResult.rows[0].rating,
          comment: feedbackResult.rows[0].comment
      });
  } catch (err) {
      console.error('Error fetching feedback:', err);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});


/////////////////////////////////////////////////////// Patient er part//////////////////////////////////////////////////////
app.post('/submit-profile', async (req, res) => {
  const { firstName, lastName, contactNumber, email, date_of_birth, city } = req.body;

  const query = 
    `INSERT INTO patient_profile 
    (first_name, last_name, contact_number, email, date_of_birth, city) 
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;`;

  try {
    const result = await pool.query(query, [firstName, lastName, contactNumber, email, date_of_birth, city]);
    req.session.userId = result.rows[0].id;
    req.session.userRole = 'patient';
    res.status(201).json({ message: 'Patient profile created successfully', patientProfile: result.rows[0] });
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ message: 'Error creating patient profile', error: err.message });
  }
});


app.get('/api/user', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User not logged in' });
  }

  try {
    const result = await pool.query('SELECT * FROM patient_profile WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user data', error: err.message });
  }
});


app.put('/api/user', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User not logged in' });
  }

  const { firstName, lastName, contactNumber, email, city } = req.body;
  const query = 
    `UPDATE patient_profile 
    SET first_name = $1, last_name = $2, contact_number = $3, email = $4, city = $5 
    WHERE id = $6 
    RETURNING *;`;

  try {
    const result = await pool.query(query, [firstName, lastName, contactNumber, email, city, userId]);
    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user data', error: err.message });
  }
});


app.delete('/api/user', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(400).json({ message: 'User not logged in' });
  }

  try {
    await pool.query('DELETE FROM patient_profile WHERE id = $1', [userId]);
    req.session.destroy(); 
    res.json({ message: 'Profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user data', error: err.message });
  }
});

/////////////////////////////////////////////////////// Doctor er part//////////////////////////////////////////////////////
app.post('/submit-doctor-profile', async (req, res) => {
  const { firstName, lastName, email, degrees, hospitals, fee, specialization, phoneNumber, experience, licenseNumber } = req.body;

  const query = 
    `INSERT INTO doctor_profile 
    (first_name, last_name, email, degrees, hospitals, fee, specialization, phone_number, experience, license_number) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;`;

  try {
    const result = await pool.query(query, [firstName, lastName, email, degrees, hospitals, fee, specialization, phoneNumber, experience, licenseNumber]);
    req.session.doctorId = result.rows[0].id;
    req.session.userRole = 'doctor';
    res.status(201).json({ message: 'Doctor profile created successfully', doctorProfile: result.rows[0] });
  } catch (err) {
    console.error('Error inserting data:', err);
    res.status(500).json({ message: 'Error creating doctor profile', error: err.message });
  }
});

app.get('/api/user-session-status', (req, res) => {
  if (req.session.userId || req.session.doctorId) {
      res.json({ 
          loggedIn: true, 
          role: req.session.userRole 
      });
  } else {
      res.json({ loggedIn: false });
  }
});


app.get('/api/doctor', async (req, res) => {
  const doctorId = req.session.doctorId;

  if (!doctorId) {
    return res.status(400).json({ message: 'Doctor not logged in' });
  }

  try {
    const result = await pool.query('SELECT * FROM doctor_profile WHERE id = $1', [doctorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching doctor data', error: err.message });
  }
});


app.put('/api/doctor', async (req, res) => {
  const doctorId = req.session.doctorId;

  if (!doctorId) {
    return res.status(400).json({ message: 'Doctor not logged in' });
  }

  const { firstName, lastName, email, degrees, hospitals, fee, specialization, phoneNumber, experience, licenseNumber } = req.body;
  const query = 
    `UPDATE doctor_profile 
    SET first_name = $1, last_name = $2, email = $3, degrees = $4, hospitals = $5, fee = $6, specialization = $7, phone_number = $8, experience = $9, license_number = $10
    WHERE id = $11 
    RETURNING *;`;

  try {
    const result = await pool.query(query, [firstName, lastName, email, degrees, hospitals, fee, specialization, phoneNumber, experience, licenseNumber, doctorId]);
    res.json({ message: 'Profile updated successfully', doctor: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Error updating doctor data', error: err.message });
  }
});


app.delete('/api/doctor', async (req, res) => {
  const doctorId = req.session.doctorId;

  if (!doctorId) {
    return res.status(400).json({ message: 'Doctor not logged in' });
  }

  try {
    await pool.query('DELETE FROM doctor_profile WHERE id = $1', [doctorId]);
    req.session.destroy(); 
    res.json({ message: 'Profile deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting doctor data', error: err.message });
  }
});


const medicines = [
  { id: 1, name: "Napa", description: "Napa is used for pain relief and fever.", image: "Images/napa.jpg.png" },
  { id: 2, name: "Ceevit", description: "Ceevit is a vitamin C supplement.", image: "Images/ceevit.jpg.png" },
  { id: 3, name: "Sergel", description: "Sergel is used to treat stomach issues.", image: "Images/sergel.png" },
];

/////////////////////////////////////////////////////// Medicine er part//////////////////////////////////////////////////////
app.get('/api/medicines', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  const filteredMedicines = medicines.filter(med => med.name.toLowerCase().includes(query));
  res.json(filteredMedicines);
});

app.post('/login', async (req, res) => {
  const { email } = req.body;
  try {
    
    const patientResult = await pool.query('SELECT * FROM patient_profile WHERE email = $1', [email]);
    
    if (patientResult.rows.length > 0) {
      req.session.userId = patientResult.rows[0].id;
      req.session.userRole = 'patient';
      return res.json({ message: 'Login successful', role: 'patient' });
    }

    
    const doctorResult = await pool.query('SELECT * FROM doctor_profile WHERE email = $1', [email]);
    
    if (doctorResult.rows.length > 0) {
      req.session.doctorId = doctorResult.rows[0].id;
      req.session.userRole = 'doctor';
      return res.json({ message: 'Login successful', role: 'doctor' });
    }

    res.status(401).json({ message: 'Login failed: User not found' });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});
app.post('/api/appointments', async (req, res) => {
  const { doctorId, appointmentType, date, time } = req.body;
  const userId = req.session.userId;

  if (!userId) {
      return res.status(401).json({ message: 'You must be logged in to book an appointment.' });
  }

  const query = `
      INSERT INTO appointments (patient_id, appointment_type, date, time)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
  `;

  try {
      const result = await pool.query(query, [userId,appointmentType, date, time]);
      res.status(201).json({ message: 'Appointment booked successfully', appointment: result.rows[0] });
  } catch (err) {
      console.error('Error booking appointment:', err.message, err.stack);  
      res.status(500).json({ message: 'Error booking appointment', error: err.message });
  }
});
//////////////////////Blood/////////////////
app.post('/submit-blood', async (req, res) => {
  const { firstName, lastName, address, bloodType, donationHistory, lastDonation, eligibility } = req.body;
  const userId = req.session.userId;  

  if (!userId) {
      return res.status(401).json({ message: 'You must be logged in to register as a donor.' });
  }

  const query = `
      INSERT INTO blood_donors (patient_id, first_name, last_name, address, blood_type, donation_history, last_donation, eligibility)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
  `;

  try {
      const result = await pool.query(query, [userId, firstName, lastName, address, bloodType, donationHistory, lastDonation, eligibility]);
      // res.status(201).json({ message: 'Blood profile created successfully', bloodDonor: result.rows[0] });
      res.redirect('/med3.html');  
  } catch (err) {
      console.error('Error inserting data:', err);
      res.status(500).json({ message: 'Error creating Blood profile', error: err.message });
  }
});
app.post('/submit-feedback', async (req, res) => {
  const { name, rating, comment } = req.body;
  const userId = req.session.userId;

  if (!userId) {
      return res.status(401).json({ message: 'User not logged in' });
  }

  const query = `
      INSERT INTO feedback (patient_id, name, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
  `;

  try {
      const result = await pool.query(query, [userId, name, rating, comment]);
      res.redirect('/med3.html');
  } catch (err) {
      console.error('Error submitting feedback:', err);
      res.status(500).json({ message: 'Error submitting feedback', error: err.message });
  }
});

app.post('/save-prescription', async (req, res) => {
  const { name, date, directions, special_notes, next_round } = req.body;

  try {
      await pool.query(
          'INSERT INTO prescription (name, date, directions, special_notes, next_round) VALUES ($1, $2, $3, $4, $5)',
          [name, date, directions, special_notes, next_round]
      );
      res.redirect('/med4');  // Redirect to med4 page after saving the prescription
  } catch (err) {
      console.error('Error saving prescription:', err.message);
      res.status(500).json({ message: 'Error saving prescription' });
  }
});
//////////////medicine json///////////////////
app.get('/api/medicines', async (req, res) => {
  const searchQuery = req.query.q;
  let query = 'SELECT * FROM medicine';
  let values = [];

  if (searchQuery) {
    query += ' WHERE name ILIKE $1';
    values.push(`%${searchQuery}%`);
  }

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
});

app.get('/api/medicine/:id', async (req, res) => {
  const medicineId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM medicine WHERE id = $1', [medicineId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Medicine not found' });
    }
  } catch (err) {
    console.error('Error fetching medicine info:', err);
    res.status(500).json({ error: 'Failed to fetch medicine info' });
  }
});

app.get('/export-medicine', async (req, res) => {
  try {
    // Fetching data from the 'medicine' table
    const result = await pool.query('SELECT * FROM medicine');

    // Convert rows into JSON format
    const medicineData = result.rows;

    // Write the JSON data to a file named medicine.json
    fs.writeFileSync('medicine.json', JSON.stringify(medicineData, null, 2), 'utf-8');

    // Send success response
    res.status(200).json({ message: 'Data exported successfully to medicine.json' });
  } catch (err) {
    console.error('Error fetching medicine data:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});



app.get('/api/user-session-status', (req, res) => {
  if (req.session.userId) {
    res.json({ 
      loggedIn: true, 
      role: req.session.userRole 
    });
  } else {
    res.json({ loggedIn: false });
  }
});

const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'remidy',
  password: 'home4321',
  port: 5432,
});
// Connect to the PostgreSQL client
client.connect();

// Query to fetch and format data into JSON format
client.query(`
 SELECT json_agg(json_build_object('id', medicineid, 'medicine_name', name, 'description', description , 'indications' , indications , 'sideeffects' , sideeffects, 'contraindications' ,contraindications ,'usageinstructions',usageinstructions, 'adultdose' , adultdose ,'childdose',childdose,'manufacturer',manufacturer) ) AS medicines FROM medicine;
  `, (err, res) => {
    if (err) {
      console.error('Error executing query', err.stack);
    } else {
      const jsonData = JSON.stringify(res.rows[0].medicines, null, 2);
  
      // Path to the 'medicine.json' file inside 'Public' folder
      const jsonFilePath = path.join(__dirname, 'Public', 'medicine.json');
  
      // Write the JSON data to a file named 'medicine.json'
      fs.writeFile(jsonFilePath, jsonData, (err) => {
        if (err) {
          console.error('Error writing JSON file', err);
        } else {
          console.log('JSON file has been saved!');
        }
      });
    }
    
    // Close the PostgreSQL client connection
    client.end();
  });
///////////////////////////////////////////////////////


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});




