const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { DateTime } = require('luxon');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check (VERY IMPORTANT for Azure)
app.get('/health', (req, res) => res.status(200).send('OK'));

// ---------------- TIMEZONE MAP ----------------
const TIMEZONE_MAP = {
  India: 'Asia/Kolkata',
  Germany: 'Europe/Berlin',
  USA: 'America/New_York',
  UK: 'Europe/London'
};

// ---------------- EXECUTE ----------------
app.post('/activity/execute', (req, res) => {
  try {
    console.log('Execute payload:', JSON.stringify(req.body));

    const inArgs =
      req.body?.inArguments?.reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {}
      ) || {};

    const subscriberKey = inArgs.subscriberKey || '';
    const country = inArgs.country;

    if (!country || !TIMEZONE_MAP[country]) {
      return res.json({
        allowSend: false,
        error: 'Invalid or missing country'
      });
    }

    const timezone = TIMEZONE_MAP[country];
    const now = DateTime.now().setZone(timezone);

    const allowSend = now.hour >= 9 && now.hour < 18;

    let nextSendTime = null;
    if (!allowSend) {
      const next =
        now.hour < 9
          ? now.set({ hour: 9, minute: 0, second: 0 })
          : now.plus({ days: 1 }).set({ hour: 9, minute: 0, second: 0 });

      nextSendTime = next.toUTC().toISO();
    }

    return res.json({
      subscriberKey,
      country,
      timezone,
      allowSend,
      evaluatedAtLocal: now.toISO(),
      nextSendTime
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      allowSend: false,
      error: 'Server error'
    });
  }
});

// ---------------- REQUIRED SFMC LIFECYCLE ----------------
app.post('/activity/save', (req, res) => res.json({ status: 'ok' }));
app.post('/activity/validate', (req, res) => res.json({ status: 'ok' }));
app.post('/activity/publish', (req, res) => res.json({ status: 'ok' }));
app.post('/activity/stop', (req, res) => res.json({ status: 'ok' }));

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Custom Activity running on port ${PORT}`);
});
