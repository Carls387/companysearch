const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/search', (req, res) => {
  const companyName = req.body.company;
  if (!companyName) return res.status(400).json({ error: 'Company name is required' });

  exec(`node scraper.js "${companyName}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: 'Scraper failed to run' });
    }

    fs.readFile('results.json', 'utf8', (err, data) => {
      if (err) return res.status(500).json({ error: 'Failed to read results' });
      res.json(JSON.parse(data));
    });
  });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
