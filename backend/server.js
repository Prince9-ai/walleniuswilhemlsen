// server.js (Real-time + optional simulation)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch'); // for geocoding
const http = require('http');
const { Server } = require('socket.io');
const path = require('path'); // ✅ added for serving frontend

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/shiptracker';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ Mongo connection error:', err.message);
    process.exit(1);
  });

// Shipment schema
const shipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true, unique: true, index: true },
  senderName: String,
  senderContact: String,
  consigneeName: String,
  consigneeContact: String,
  origin: String,
  destination: String,
  cargo: String,
  packageDescription: String,
  weight: Number,
  dimensions: String,
  quantity: Number,
  status: { type: String, default: 'Booked' },
  location: String,
  latitude: Number,
  longitude: Number,
  remarks: String,
  estimatedDeparture: String,
  estimatedDelivery: String,
  history: [{
    status: String,
    location: String,
    remarks: String,
    date: Date,
    latitude: Number,
    longitude: Number
  }]
}, { timestamps: true });

const Shipment = mongoose.model('Shipment', shipmentSchema);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve frontend (admin.html, track-trace.html, index.html, etc.)
app.use(express.static(path.join(__dirname, "../frontend/www.walleniuswilhelmsen.com")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/www.walleniuswilhelmsen.com/index.html"));
});

// HTTP + Socket.io
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*'} });
io.on('connection', (socket) => {
  socket.on('track', (trackingNumber) => {
    if (!trackingNumber) return;
    socket.join(trackingNumber);
  });
});

// Generate tracking number
function genTracking(){
  return 'BK' + Date.now().toString(36).toUpperCase().slice(-8);
}

// Utility: geocode location string
async function geocodeLocation(location) {
  if (!location) return {};
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`, {
      headers: { 'User-Agent': 'shiptracker/1.0 (contact@example.com)' }
    });
    const data = await res.json();
    if (data && data[0]) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
  } catch (err) {
    console.error('Geocoding error:', err.message);
  }
  return {};
}

// ================== Start Server ==================
const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log(`🚀 Server + Socket.io listening on ${PORT}`));
