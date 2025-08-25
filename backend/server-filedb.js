// ================== Imports ==================
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================== Initialize App ==================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());

// ================== Serve Frontend ==================
app.use(express.static(path.join(__dirname, "../frontend/www.walleniuswilhelmsen.com")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/www.walleniuswilhelmsen.com/index.html"));
});

// ================== File Database ==================
const DB_FILE = path.join(__dirname, "shipments.json");
let shipments = [];

function loadShipments() {
  if (fs.existsSync(DB_FILE)) {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    try {
      shipments = JSON.parse(data);
      if (!Array.isArray(shipments)) shipments = [];
    } catch {
      shipments = [];
    }
  } else {
    shipments = [];
  }
}

function saveShipments() {
  fs.writeFileSync(DB_FILE, JSON.stringify(shipments, null, 2));
}

loadShipments();

// Helper to generate a tracking number similar to server.js
function genTracking() {
  return "BK" + Date.now().toString(36).toUpperCase().slice(-8);
}

// ================== Admin API ==================
app.post("/admin/book", (req, res) => {
  let {
    senderName, senderContact,
    consigneeName, consigneeContact,
    origin, destination,
    cargo, packageDescription,
    weight, dimensions, quantity,
    estimatedDeparture, estimatedDelivery,
    status, location, remarks
  } = req.body;

  if (!origin || !destination || !cargo) {
    return res.json({ ok: false, error: "Required fields missing" });
  }

  const trackingNumber = req.body.trackingNumber || genTracking();

  const now = new Date();
  const shipment = {
    trackingNumber,
    senderName: senderName || "",
    senderContact: senderContact || "",
    consigneeName: consigneeName || "",
    consigneeContact: consigneeContact || "",
    origin,
    destination,
    cargo,
    packageDescription: packageDescription || "",
    weight: typeof weight === "number" ? weight : Number(weight) || 0,
    dimensions: dimensions || "",
    quantity: typeof quantity === "number" ? quantity : Number(quantity) || 0,
    estimatedDeparture: estimatedDeparture || "",
    estimatedDelivery: estimatedDelivery || "",
    status: status || "Booked",
    location: location || "",
    remarks: remarks || "",
    date: now,
    createdAt: now,
    updatedAt: now,
    history: [{
      status: status || "Booked",
      location: location || "",
      remarks: remarks || "",
      date: now
    }],
  };

  shipments.unshift(shipment); // newest first
  saveShipments();

  res.json({ ok: true, shipment });
});

// NEW: List shipments for admin (matches server.js shape)
app.get("/admin/list", (req, res) => {
  res.json(shipments.slice(0, 500));
});

// NEW: Update shipment (admin)
app.put("/admin/update/:trackingNumber", (req, res) => {
  const tn = req.params.trackingNumber;
  const s = shipments.find((x) => x.trackingNumber === tn);
  if (!s) return res.status(404).json({ ok: false, error: "Not found" });

  const {
    status, location, remarks,
    estimatedDeparture, estimatedDelivery,
    latitude, longitude
  } = req.body;

  if (typeof status === "string") s.status = status;
  if (typeof location === "string") s.location = location;
  if (typeof remarks === "string") s.remarks = remarks;
  if (typeof estimatedDeparture === "string") s.estimatedDeparture = estimatedDeparture;
  if (typeof estimatedDelivery === "string") s.estimatedDelivery = estimatedDelivery;
  if (typeof latitude === "number") s.latitude = latitude;
  if (typeof longitude === "number") s.longitude = longitude;

  s.updatedAt = new Date();
  s.history = s.history || [];
  s.history.push({
    status: s.status,
    location: s.location,
    remarks: s.remarks,
    date: new Date(),
    latitude: s.latitude,
    longitude: s.longitude
  });

  saveShipments();

  io.to(tn).emit("shipment:update", {
    tracking_number: s.trackingNumber,
    status: s.status,
    location: s.location || "",
    latitude: s.latitude,
    longitude: s.longitude,
    remarks: s.remarks || "",
    estimatedDeparture: s.estimatedDeparture || "",
    estimatedDelivery: s.estimatedDelivery || ""
  });

  res.json({ ok: true, shipment: s });
});

// NEW: Delete shipment (admin)
app.delete("/admin/delete/:trackingNumber", (req, res) => {
  const tn = req.params.trackingNumber;
  const before = shipments.length;
  shipments = shipments.filter((x) => x.trackingNumber !== tn);
  saveShipments();
  const removed = before !== shipments.length;
  res.json({ ok: true, message: removed ? `Deleted ${tn}` : "Nothing to delete" });
});

// ================== Tracking API ==================
app.get("/track", (req, res) => {
  const number = req.query.number || req.query.trackingNumber;
  if (!number) return res.json({ ok: false, error: "Tracking number required" });

  const s = shipments.find((x) => x.trackingNumber === number);
  if (!s) return res.status(404).json({ ok: false, error: "Not found" });

  return res.json({
    ok: true,
    tracking_number: s.trackingNumber,
    status: s.status,
    location: s.location || "",
    latitude: s.latitude,
    longitude: s.longitude,
    remarks: s.remarks || "",
    estimatedDeparture: s.estimatedDeparture || "",
    estimatedDelivery: s.estimatedDelivery || "",
    origin: s.origin || "",
    destination: s.destination || "",
    cargo: s.cargo || "",
    packageDescription: s.packageDescription || "",
    weight: s.weight || 0,
    dimensions: s.dimensions || "",
    quantity: s.quantity || 0,
    history: s.history || []
  });
});

// ================== Socket.io ==================
io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("track", (trackingNumber) => {
    if (trackingNumber) socket.join(trackingNumber);
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// ================== Start Server ==================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`FileDB server + Socket.io running on port ${PORT}`);
});
