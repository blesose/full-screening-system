// api/[...entity].js
import db from './db.json' assert { type: 'json' };

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the entity from the URL: /api/applications, /api/reviews, etc.
  const entity = req.query.entity;
  const data = db[entity];

  if (data) {
    res.status(200).json(data);
  } else {
    res.status(404).json({ error: 'Entity not found' });
  }
}