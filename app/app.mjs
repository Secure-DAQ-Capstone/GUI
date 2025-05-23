/**
 * 
 * Modified E Brown and David Guaman Davila F24
 **/
import {} from "./endpoints.mjs"
import express from 'express';

const app = express();

app.use(express.json());// support json encoded bodies
app.use(express.urlencoded({extended: true}));//incoming objects are strings or arrays



export default app // useful when started as a module