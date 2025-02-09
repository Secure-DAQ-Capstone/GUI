import {getData, deleteData} from "./endpoints.mjs"
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

/*
API Call to get tasks.
Optional query parameters: id
Sample request for one task: /tasks?id=1
Sample request for multiple tasks: /tasks?id=1&id=2&id=3
Sample request for all tasks: /tasks (if no id passed all tasks are retrieved)
*/
app.get('/data', getData);

/*
API Call to delete tasks.
Required query parameters: id
Sample request for one task: /tasks?id=1
Sample request for multiple tasks: /tasks?id=1&id=2&id=3
*/
app.delete('/data', deleteData);


export default server 