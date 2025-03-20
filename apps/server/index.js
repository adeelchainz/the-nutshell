const express = require("express");

const app = express();
const port = 3001;

app.get("/", (req, res) => {
    res.send(`Hello from Server! Random Number: ${utils.randomNumber()}`);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
