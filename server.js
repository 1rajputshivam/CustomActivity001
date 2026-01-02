const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { DateTime } = require('luxon');
require('dotenv').config();
 
const app = express();
const PORT = process.env.PORT || 3000;   // 👈 FIXED
 
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
 
// Health check
app.get('/health', (req, res) => res.send('OK'));
 
// ---------- TIME WINDOW LOGIC ----------
function evaluateDaytimeWindow(countryName) {
  const countryTimezones = {
    India: 'Asia/Kolkata',
    Germany: 'Europe/Berlin',
    USA: 'America/New_York',
    UK: 'Europe/London',
    Slovakia: 'Europe/Bratislava'
  };
 
  const startHour = 9;
  const endHour = 18;
 
  if (!countryName || !countryTimezones[countryName]) {
    return { allowSend: false };
  }
 
  const nowLocal = DateTime.now().setZone(countryTimezones[countryName]);
 
  if (nowLocal.hour >= startHour && nowLocal.hour < endHour) {
    return { allowSend: true };
  }
 
  const nextLocal =
    nowLocal.hour < startHour
      ? nowLocal.set({ hour: startHour, minute: 0, second: 0, millisecond: 0 })
      : nowLocal.plus({ days: 1 }).set({ hour: startHour, minute: 0, second: 0, millisecond: 0 });
 
  return {
    allowSend: false,
    nextSendTimeUTC: nextLocal.toUTC().toISO()
  };
}
 
// 🔍 LOCAL DEBUG ENDPOINT
app.get('/debug/send-window', (req, res) => {
  const { country } = req.query;
  res.json(evaluateDaytimeWindow(country));
});
 
// ---------- EXECUTE ENDPOINT ----------
app.post('/activity/execute', async (req, res) => {
  console.log('🔥 Execute payload:', JSON.stringify(req.body, null, 2));
 
  const inArgs =
    req.body?.inArguments?.reduce((acc, curr) => ({ ...acc, ...curr }), {}) || {};
 
  const country = inArgs.country;
  const result = evaluateDaytimeWindow(country);
 
  console.log('🕒 Time window result:', result);
  return res.status(200).json(result);
});
 
// Lifecycle endpoints (required by Journey Builder)
app.post('/activity/save', (req, res) => res.sendStatus(200));
app.post('/activity/validate', (req, res) => res.sendStatus(200));
app.post('/activity/publish', (req, res) => res.sendStatus(200));
app.post('/activity/stop', (req, res) => res.sendStatus(200));
 
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});