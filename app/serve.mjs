import express from 'express';
import path from 'path'

import app from './app.mjs'
const port = 8820;

const server = express();

server.use(express.text());

server.use(express.static(path.join(path.resolve(), 'public')))

server.use(app);

server.listen(port, function (err) {
    if (err) console.log(err);
    console.log("Server listening on PORT", port);
});

export default server 