// server.js (Real-time + optional simulation)
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fetch = require('node-fetch'); // for geocoding
const http = require('http');
const { Server } = require('socket.io');

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

// --- Simple in-memory simulators: move toward destination when status === 'In Port' ---
const simulators = new Map(); // tn -> intervalId

function stopSimulation(tn){
  const itv = simulators.get(tn);
  if (itv) {
    clearInterval(itv);
    simulators.delete(tn);
    console.log('🛑 Stopped simulation for', tn);
  }
}

async function startSimulation(shipment){
  const tn = shipment.trackingNumber;
  // don't start duplicates
  if (simulators.has(tn)) return;

  const s = await Shipment.findOne({ trackingNumber: tn });
  if (!s) return;

  // resolve start (current) and destination coordinates
  let startLat = s.latitude, startLng = s.longitude;
  if (startLat == null || startLng == null) {
    const oc = await geocodeLocation(s.origin);
    startLat = oc.latitude; startLng = oc.longitude;
  }
  const destCoords = await geocodeLocation(s.destination);
  const destLat = destCoords.latitude, destLng = destCoords.longitude;
  if (startLat == null || startLng == null || destLat == null || destLng == null) {
    console.log('⚠️ Missing coords; cannot simulate for', tn);
    return;
  }

  // place current at start if missing
  if (s.latitude == null || s.longitude == null) {
    s.latitude = startLat; s.longitude = startLng;
  }

  console.log('🟢 Starting simulation for', tn);
  const speedKmh = 30;            // low speed so movement is visible (tweak freely)
  const tickMs = 3000;            // update every 3s
  const stepKm = (speedKmh * (tickMs/1000)) / 3600; // distance per tick

  function haversine(lat1, lon1, lat2, lon2){
    const R = 6371;
    const toRad = (d)=> d*Math.PI/180;
    const dLat = toRad(lat2-lat1);
    const dLon = toRad(lon2-lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R*c;
  }
  function moveToward(lat1, lon1, lat2, lon2, distKm){
    const total = haversine(lat1, lon1, lat2, lon2);
    if (total === 0 || distKm >= total) return { lat: lat2, lon: lon2, done: true };
    const f = distKm / total;
    return { lat: lat1 + (lat2-lat1)*f, lon: lon1 + (lon2-lon1)*f, done: false };
  }

  const itv = setInterval(async () => {
    try {
      const doc = await Shipment.findOne({ trackingNumber: tn });
      if (!doc) return stopSimulation(tn);
      if (doc.status === 'Delivered') return stopSimulation(tn);

      const { lat, lon, done } = moveToward(doc.latitude ?? startLat, doc.longitude ?? startLng, destLat, destLng, stepKm);
      doc.latitude = lat;
      doc.longitude = lon;
      doc.location = doc.location || 'En route';
      doc.updatedAt = new Date();
      doc.history.push({ status: doc.status, location: doc.location, remarks: doc.remarks, date: new Date(), latitude: lat, longitude: lon });
      await doc.save();

      io.to(tn).emit('shipment:update', {
        tracking_number: tn,
        latitude: lat,
        longitude: lon,
        status: doc.status,
        location: doc.location,
        remarks: doc.remarks,
        estimatedDeparture: doc.estimatedDeparture,
        estimatedDelivery: doc.estimatedDelivery
      });

      if (done) {
        doc.status = 'Delivered';
        await doc.save();
        io.to(tn).emit('shipment:update', { tracking_number: tn, status: 'Delivered', latitude: destLat, longitude: destLng });
        stopSimulation(tn);
      }
    } catch (e) {
      console.error('Simulation error', e.message);
    }
  }, tickMs);
  simulators.set(tn, itv);
}

/** Add booking (admin) */
app.post('/admin/book', async (req,res) => {
  try {
    const {
      trackingNumber, senderName, senderContact,
      consigneeName, consigneeContact, origin, destination,
      cargo, packageDescription, weight, dimensions, quantity,
      status, location, remarks, estimatedDeparture, estimatedDelivery
    } = req.body;

    const tn = trackingNumber || genTracking();
    const coords = await geocodeLocation(location);

    const s = new Shipment({
      trackingNumber: tn,
      senderName, senderContact, consigneeName, consigneeContact,
      origin, destination, cargo, packageDescription, weight, dimensions, quantity,
      status: status || 'Booked',
      location, remarks,
      estimatedDeparture, estimatedDelivery,
      latitude: coords.latitude,
      longitude: coords.longitude,
      history: [{
        status: status || 'Booked',
        location,
        remarks,
        date: new Date(),
        latitude: coords.latitude,
        longitude: coords.longitude
      }]
    });

    await s.save();
    res.status(201).json({ ok:true, shipment: s });
  } catch(err) {
    console.error(err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

/** Update booking (admin) */
app.put('/admin/update/:trackingNumber', async (req,res) => {
  try {
    const tn = req.params.trackingNumber;
    const { status, location, remarks, estimatedDeparture, estimatedDelivery, latitude, longitude } = req.body;

    const s = await Shipment.findOne({ trackingNumber: tn });
    if(!s) return res.status(404).json({ ok:false, error:'Not found' });

    if(status) s.status = status;
    if(location !== undefined) {
      s.location = location;
      const coords = await geocodeLocation(location);
      if (coords.latitude && coords.longitude) {
        s.latitude = coords.latitude;
        s.longitude = coords.longitude;
      }
    }
    if (typeof latitude === 'number') s.latitude = latitude;
    if (typeof longitude === 'number') s.longitude = longitude;
    if(remarks !== undefined) s.remarks = remarks;
    if(estimatedDeparture !== undefined) s.estimatedDeparture = estimatedDeparture;
    if(estimatedDelivery !== undefined) s.estimatedDelivery = estimatedDelivery;

    s.history.push({
      status: s.status,
      location: s.location,
      remarks: s.remarks,
      date: new Date(),
      latitude: s.latitude,
      longitude: s.longitude
    });

    s.updatedAt = new Date();
    await s.save();

    // Emit live update
    io.to(tn).emit('shipment:update', {
      tracking_number: s.trackingNumber,
      status: s.status,
      location: s.location || '',
      latitude: s.latitude,
      longitude: s.longitude,
      remarks: s.remarks || '',
      estimatedDeparture: s.estimatedDeparture || '',
      estimatedDelivery: s.estimatedDelivery || ''
    });

    // Start/stop simulation based on status & presence of destination
    if (s.status === 'In Port' && s.destination) startSimulation(s);
    if (s.status === 'Delivered') stopSimulation(tn);

    res.json({ ok:true, shipment: s });
  } catch(err) {
    console.error(err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

/** Delete shipment (admin) */
app.delete('/admin/delete/:trackingNumber', async (req,res) => {
  try {
    const tn = req.params.trackingNumber;
    await Shipment.findOneAndDelete({ trackingNumber: tn });
    stopSimulation(tn);
    res.json({ ok:true, message: `Deleted ${tn}` });
  } catch(err) {
    console.error(err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

/** Public track endpoint */
app.get('/track', async (req,res) => {
  try {
    const number = req.query.number || req.query.trackingNumber;
    if(!number) return res.status(400).json({ ok:false, error:'missing number param' });
    const s = await Shipment.findOne({ trackingNumber: number });
    if(!s) return res.status(404).json({ ok:false });

    res.json({
      tracking_number: s.trackingNumber,
      status: s.status,
      location: s.location || '',
      latitude: s.latitude,
      longitude: s.longitude,
      remarks: s.remarks || '',
      estimatedDeparture: s.estimatedDeparture || '',
      estimatedDelivery: s.estimatedDelivery || '',
      origin: s.origin || '',
      destination: s.destination || '',
      history: s.history || []
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ ok:false, error: err.message });
  }
});

/** Quick list for admin */
app.get('/admin/list', async (req,res) => {
  const list = await Shipment.find().sort({ createdAt:-1 }).limit(500);
  res.json(list);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log(`🚀 Server + Socket.io listening on ${PORT}`));
