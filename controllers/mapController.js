require('dotenv').config();

const getStaticMapUrl = (req, res) => {
  const { pickup, dropoff } = req.query;
  if (!pickup || !dropoff) {
    return res.status(400).json({ error: 'Missing pickup or dropoff parameters' });
  }
console.log('mapController.js loaded');

  const base = 'https://maps.googleapis.com/maps/api/staticmap';
  const size = '600x300';
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const url = `${base}?size=${size}&markers=color:green|label:P|${encodeURIComponent(pickup)}&markers=color:red|label:D|${encodeURIComponent(dropoff)}&key=${apiKey}`;

  return res.json({ url });
};

module.exports = { getStaticMapUrl };
