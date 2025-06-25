// server.js
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


// scraper.js
const { chromium } = require('playwright');
const fs = require('fs');

async function runSearch(companyName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const query = `site:linkedin.com/in/ \"${companyName}\"`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

  const results = await page.$$eval('div.g', (divs, company) => {
    return divs.map(div => {
      const link = div.querySelector('a')?.href;
      const text = div.innerText;
      if (!link || !link.includes('linkedin.com/in')) return null;
      const lines = text.split('\n');
      const name = lines[0] || "";
      const titleLine = lines.find(l => l.toLowerCase().includes(company.toLowerCase()));
      const title = titleLine || "";
      return {
        name,
        title,
        company,
        link
      };
    }).filter(Boolean);
  }, companyName);

  fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
  console.log(`Saved ${results.length} results to results.json`);

  await browser.close();
}

// Allow running with CLI args
if (require.main === module) {
  const company = process.argv[2] || "Namos Solutions";
  runSearch(company);
}


// public/index.html
/* 
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sourcing Tool</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    input, button { padding: 8px; margin-right: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 8px; border: 1px solid #ccc; text-align: left; }
  </style>
</head>
<body>
  <h1>Company People Finder</h1>
  <input type="text" id="company" placeholder="Enter company name">
  <button onclick="search()">Search</button>
  <table id="results"></table>

  <script>
    async function search() {
      const company = document.getElementById('company').value;
      const res = await fetch('/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company })
      });
      const data = await res.json();
      const table = document.getElementById('results');
      table.innerHTML = '<tr><th>Name</th><th>Title</th><th>Company</th><th>LinkedIn</th></tr>' +
        data.map(row => `
          <tr>
            <td>${row.name}</td>
            <td>${row.title}</td>
            <td>${row.company}</td>
            <td><a href="${row.link}" target="_blank">Profile</a></td>
          </tr>`).join('');
    }
  </script>
</body>
</html>
*/
