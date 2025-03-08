import {getData, getLatestData, getLabelSpecificData, getLabelSpecificDataForPlottingByTimeForTheLastHour, getDataNotVerified} from "./endpoints.mjs"
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
API Call to get data entrires.
Optional query parameters: id
Sample request for one task: /data?id=1
Sample request for multiple datum: /data?id=1&id=2&id=3
Sample request for all data: /data (if no id passed all data are retrieved)
*/
app.get('/data', getData);

/*
API Call to get the lastest data entry for each unqique label.
*/
app.get('/latestData', getLatestData);

/*
API Call to get all data entries of a specific label.
Required query parameters: label
Sample request for one label: /labelSpecificData?label=History
*/
app.get('/labelSpecificData', getLabelSpecificData);

/*
API Call to get data of the last hour for a specific label for plotting:
Required query parameters: label
Sample request for one label: /plotData?label=History
*/
app.get('/plotData', getLabelSpecificDataForPlottingByTimeForTheLastHour);

/*
API Call to get all Data Entries that their Digital Signatures and Decryption were not Successfully Verified.
Sample request for multiple datum: /dataNotVerified?label=Humidity
Sample request for all data: /dataNotVerified (if no label passed all data are retrieved)
*/
app.get('/dataNotVerified', getDataNotVerified);

export default server 