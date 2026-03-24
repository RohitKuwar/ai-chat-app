const express = require('express')

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(5000, (err) => {
  if (err) {
    console.error("Error starting server:", err);
  } else {
    console.log("Server running on port 5000");
  }
});