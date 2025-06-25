
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
  if (!companyName) return res.status(400).json({ error:
