// server-filedb.js (Real-time + optional simulation)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const http = require('http');
const { Server } = require('socket.io');

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  if (!fs.existsSync(DATA_FILE))
    fs.writeFileSync(DATA_FILE, JSON.stringify({ shipments: [] }, null, 2));
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writeData(d) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}
function genTracking() {
  return 'BK' + Date.now().toString(36).toUpperCase().slice(-8);
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  socket.on('track', (tn) => tn && socket.join(tn));
});

async function geocodeLocation(location){
  if (!location) return {};
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`, {
      headers: { 'User-Agent': 'shiptracker/1.0 (contact@example.com)' }
    });
    const data = await res.json();
    if (data && data[0]) return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch(e){ console.error('Geocode error', e.message); }
  return {};
}

// Simulation
const simulators = new Map();
function stopSimulation(tn){
  const itv = simulators.get(tn);
  if (itv) { clearInterval(itv); simulators.delete(tn); console.log('🛑 Stopped simulation for', tn); }
}
async function startSimulation(tn){
  if (simulators.has(tn)) return;
  const d = readData();
  const s = d.shipments.find(x => x.trackingNumber === tn);
  if (!s) return;

  let startLat = s.latitude, startLng = s.longitude;
  if (startLat == null || startLng == null){
    const oc = await geocodeLocation(s.origin);
    startLat = oc.latitude; startLng = oc.longitude;
  }
  const dc = await geocodeLocation(s.destination);
  const destLat = dc.latitude, destLng = dc.longitude;
  if (startLat == null || startLng == null || destLat == null || destLng == null){
    console.log('⚠️ Missing coords; cannot simulate for', tn);
    return;
  }
  if (s.latitude == null || s.longitude == null){ s.latitude = startLat; s.longitude = startLng; writeData(d); }

  function hav(lat1, lon1, lat2, lon2){
    const R=6371, toRad=(x)=>x*Math.PI/180;
    const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
    const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
    return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  function step(lat1, lon1, lat2, lon2, distKm){
    const total = hav(lat1, lon1, lat2, lon2);
    if (total===0 || distKm>=total) return { lat: lat2, lon: lon2, done: true };
    const f = distKm/total;
    return { lat: lat1+(lat2-lat1)*f, lon: lon1+(lon2-lon1)*f, done: false };
  }

  const speedKmh = 30, tickMs = 3000, stepKm = (speedKmh*(tickMs/1000))/3600;
  const itv = setInterval(() => {
    const d2 = readData();
    const s2 = d2.shipments.find(x => x.trackingNumber === tn);
    if (!s2) return stopSimulation(tn);
    if (s2.status === 'Delivered') return stopSimulation(tn);

    const curLat = s2.latitude ?? startLat;
    const curLng = s2.longitude ?? startLng;
    const { lat, lon, done } = step(curLat, curLng, destLat, destLng, stepKm);

    s2.latitude = lat; s2.longitude = lon;
    s2.location = s2.location || 'En route';
    s2.updatedAt = new Date();
    s2.history.push({ status: s2.status, location: s2.location, latitude: lat, longitude: lon, remarks: s2.remarks, date: new Date() });
    writeData(d2);

    io.to(tn).emit('shipment:update', {
      tracking_number: tn,
      status: s2.status,
      location: s2.location,
      latitude: lat,
      longitude: lon,
      remarks: s2.remarks,
      estimatedDeparture: s2.estimatedDeparture,
      estimatedDelivery: s2.estimatedDelivery
    });

    if (done){
      s2.status = 'Delivered';
      writeData(d2);
      io.to(tn).emit('shipment:update', { tracking_number: tn, status: 'Delivered', latitude: destLat, longitude: destLng });
      stopSimulation(tn);
    }
  }, tickMs);
  simulators.set(tn, itv);
  console.log('🟢 Starting simulation for', tn);
}

// Add booking
app.post('/admin/book', async (req, res) => {
  try {
    const d = readData();
    const {
      trackingNumber,
      senderName,
      senderContact,
      consigneeName,
      consigneeContact,
      origin,
      destination,
      cargo,
      packageDescription,
      weight,
      dimensions,
      quantity,
      status,
      location,
      latitude,
      longitude,
      remarks,
      estimatedDeparture,
      estimatedDelivery
    } = req.body;

    const tn = trackingNumber || genTracking();
    if (d.shipments.find(s => s.trackingNumber === tn))
      return res.status(400).json({ ok: false, error: 'duplicate tracking number' });

    let lat = typeof latitude === 'number' ? latitude : null;
    let lon = typeof longitude === 'number' ? longitude : null;
    if (!lat || !lon){
      const coords = await geocodeLocation(location);
      lat = coords.latitude ?? null;
      lon = coords.longitude ?? null;
    }

    const s = {
      trackingNumber: tn,
      senderName,
      senderContact,
      consigneeName,
      consigneeContact,
      origin,
      destination,
      cargo,
      packageDescription: packageDescription || "",
      weight,
      dimensions,
      quantity,
      status: status || 'Booked',
      location,
      latitude: lat,
      longitude: lon,
      remarks,
      estimatedDeparture: estimatedDeparture || null,
      estimatedDelivery: estimatedDelivery || null,
      history: [
        {
          status: status || 'Booked',
          location,
          latitude: lat,
          longitude: lon,
          remarks,
          date: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    d.shipments.unshift(s);
    writeData(d);
    res.json({ ok: true, shipment: s });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Update booking
app.put('/admin/update/:trackingNumber', async (req, res) => {
  try {
    const d = readData();
    const tn = req.params.trackingNumber;
    const s = d.shipments.find(x => x.trackingNumber === tn);
    if (!s) return res.status(404).json({ ok: false, error: 'Shipment not found' });

    const { 
      status, 
      location, 
      latitude, 
      longitude, 
      remarks, 
      packageDescription, 
      estimatedDeparture, 
      estimatedDelivery, 
      date 
    } = req.body;

    if (status) s.status = status;
    if (location !== undefined) s.location = location;
    if (typeof latitude === 'number') s.latitude = latitude;
    if (typeof longitude === 'number') s.longitude = longitude;
    if (remarks !== undefined) s.remarks = remarks;
    if (packageDescription !== undefined) s.packageDescription = packageDescription;
    if (estimatedDeparture !== undefined) s.estimatedDeparture = estimatedDeparture;
    if (estimatedDelivery !== undefined) s.estimatedDelivery = estimatedDelivery;

    // derive coords from location if provided but no explicit lat/lon
    if (location && (typeof latitude !== 'number' || typeof longitude !== 'number')) {
      const coords = await geocodeLocation(location);
      if (coords.latitude && coords.longitude) {
        s.latitude = coords.latitude;
        s.longitude = coords.longitude;
      }
    }

    s.history.push({
      status: s.status,
      location: s.location,
      latitude: typeof latitude === 'number' ? latitude : (s.latitude ?? null),
      longitude: typeof longitude === 'number' ? longitude : (s.longitude ?? null),
      remarks: s.remarks,
      date: date ? new Date(date) : new Date()
    });
    s.updatedAt = new Date();
    writeData(d);

    // Emit to clients
    io.to(tn).emit('shipment:update', {
      tracking_number: s.trackingNumber,
      status: s.status,
      location: s.location,
      latitude: s.latitude,
      longitude: s.longitude,
      remarks: s.remarks,
      estimatedDeparture: s.estimatedDeparture,
      estimatedDelivery: s.estimatedDelivery
    });

    // Start/stop simulation
    if (s.status === 'In Port' && s.destination) startSimulation(tn);
    if (s.status === 'Delivered') stopSimulation(tn);

    res.json({ ok: true, shipment: s });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Delete booking
app.delete('/admin/delete/:trackingNumber', (req, res) => {
  const d = readData();
  const trackingNumber = req.params.trackingNumber;
  const index = d.shipments.findIndex(s => s.trackingNumber === trackingNumber);
  if (index >= 0) {
    d.shipments.splice(index, 1);
    writeData(d);
    stopSimulation(trackingNumber);
    res.json({ ok: true });
  } else {
    res.status(404).json({ ok: false, error: 'Not found' });
  }
});

// Track endpoint
app.get('/track', (req, res) => {
  try {
    const number = req.query.number;
    if (!number)
      return res.status(400).json({ ok: false, error: 'missing number param' });
    const d = readData();
    const s = d.shipments.find(x => x.trackingNumber === number);
    if (!s) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({
      ok: true,
      tracking_number: s.trackingNumber,
      status: s.status,
      location: s.location,
      latitude: s.latitude,
      longitude: s.longitude,
      date: s.updatedAt,
      remarks: s.remarks,
      origin: s.origin,
      destination: s.destination,
      cargo: s.cargo,
      packageDescription: s.packageDescription,
      weight: s.weight,
      dimensions: s.dimensions,
      quantity: s.quantity,
      estimatedDeparture: s.estimatedDeparture,
      estimatedDelivery: s.estimatedDelivery,
      history: s.history
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Admin list
app.get('/admin/list', (req, res) => {
  const d = readData();
  res.json(d.shipments);
});

// Seed demo shipment
app.get('/admin/seed', (req, res) => {
  const d = readData();
  const sample = {
    trackingNumber: 'ABC12345',
    senderName: 'Demo Sender',
    senderContact: '1234567890',
    consigneeName: 'Demo Consignee',
    consigneeContact: '0987654321',
    origin: 'Kuwait City, KW',
    destination: 'New York, US',
    cargo: 'Car',
    packageDescription: 'Sedan, dark blue',
    weight: 1500,
    dimensions: '450x200x180',
    quantity: 1,
    status: 'On Vessel',
    location: 'North Atlantic Ocean',
    latitude: 40.0,
    longitude: -35.0,
    remarks: 'At sea',
    estimatedDeparture: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    history: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const idx = d.shipments.findIndex(s => s.trackingNumber === sample.trackingNumber);
  if (idx === -1) d.shipments.unshift(sample);
  else d.shipments[idx] = sample;
  writeData(d);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`FileDB server + Socket.io listening on ${PORT}`));
