// // server.js
// const express = require('express');
// const db = require('./db');
// const authRoutes = require('./routes/authRoutes');
// const deanRoutes = require('./routes/deanRoutes');
// const studentRoutes = require('./routes/studentRoutes');

// const app = express();
// const PORT = 3000;

// db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// db.once('open', () => {
//   console.log('Connected to MongoDB');
// });

// app.use(express.json());


// app.get("/", (req, res) => {
//   res.send("Hello World")
// })

// app.use('/api', authRoutes);
// app.use('/api/dean', deanRoutes);
// app.use('/api/student', studentRoutes);

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });



// =============================================================================================
// =============================================================================================


// Import required dependencies
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Create the Express app
const app = express();
app.use(express.json());

// MongoDB setup
mongoose.connect('mongodb+srv://ayush:ayush@university.qzytzn9.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));


// Define the schemas
const sessionSchema = new mongoose.Schema({
  deanId: { type: String, required: true },
  studentId: { type: String },
  booked: { type: Boolean, default: false },
});

const deanSchema = new mongoose.Schema({
  universityId: { type: String, required: true },
  password: { type: String, required: true },
});

const studentSchema = new mongoose.Schema({
  universityId: { type: String, required: true },
  password: { type: String, required: true },
});

// Define the models
const Session = mongoose.model('Session', sessionSchema);
const Dean = mongoose.model('Dean', deanSchema);
const Student = mongoose.model('Student', studentSchema);

// Generate JWT token
function generateToken(payload) {
  return jwt.sign(payload, 'secretKey', { expiresIn: '1h' });
}

// Middleware to authenticate the token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  // const token = true

  if (!token) {
    return res.status(401).send("token not working");
  }

  jwt.verify(token, 'secretKey', (err, user) => {
    if (err) {
      return res.status(403).send("problem  one");
    }

    req.user = user;
    next();
  });
}

// API endpoints

// Student Login API
app.post('/api/students/login', async (req, res) => {
  const { universityId, password } = req.body;
  const student = await Student.findOne({ universityId });

  // if (!student || !bcrypt.compareSync(password, student.password)) {
  if (!student || password != student.password) {
    // console.log(student)
    return res.sendStatus(401);
  }

  const token = generateToken({ universityId: student.universityId });
  res.json({ token });
});

// Get Free Sessions API
app.get('/api/sessions', authenticateToken, async (req, res) => {
  const sessions = await Session.find({ booked: false });
  res.json({ sessions });
});

// Book Session API
app.post('/api/sessions/book', authenticateToken, async (req, res) => {
  const { sessionId } = req.body;
  const session = await Session.findById(sessionId);

  if (!session || session.booked) {
    return res.status(404).send("booking not working");
  }

  session.studentId = req.user.universityId;
  session.booked = true;
  await session.save();

  res.json({ message: 'Session booked successfully.' });
});

// Dean Login API
app.post('/api/deans/login', async (req, res) => {
  const { universityId, password } = req.body;
  const dean = await Dean.findOne({ universityId });

  // if (!dean || !bcrypt.compareSync(password, dean.password)) {
  if (!dean || password != dean.password) {
    // console.log(dean)
    return res.sendStatus(401);
  }

  const token = generateToken({ universityId: dean.universityId });
  res.json({ token });
});

// Get Pending Sessions for Dean API
app.get('/api/deans/sessions', authenticateToken, async (req, res) => {
  const sessions = await Session.find({ deanId: req.user.universityId, booked: true });
  res.json({ sessions });
});

// Student B Login API
app.post('/api/students/login', async (req, res) => {
  const { universityId, password } = req.body;
  const student = await Student.findOne({ universityId });

  // if (!student || !bcrypt.compareSync(password, student.password)) {
  if (!student || password != student.password) {
    return res.sendStatus(401);
  }

  const token = generateToken({ universityId: student.universityId });
  res.json({ token });
});

// Get Free Sessions for Student B API
app.get('/api/sessions', authenticateToken, async (req, res) => {
  const sessions = await Session.find({ booked: false });
  res.json({ sessions });
});

// Book Session for Student B API
app.post('/api/sessions/book', authenticateToken, async (req, res) => {
  const { sessionId } = req.body;
  const session = await Session.findById(sessionId);

  if (!session || session.booked) {
    return res.sendStatus(404);
  }

  session.studentId = req.user.universityId;
  session.booked = true;
  await session.save();

  res.json({ message: 'Session booked successfully.' });
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
