import { findData, findAllData, findDataByLabel} from './dbAdapter.mjs';

// API Handler for get '/data' to retrieve specific data if IDs are provided or all data if no ID is provided
export async function getData(req, resp) {
    try {
      //If data IDs are provided
      let dataIds = req.query.id;
  
      //Check if the provided parameters are an array or single value
      if (dataIds) {
        if (!Array.isArray(dataIds)) {
          dataIds = [dataIds];
        }
  
        //Array to store data retrieved
        let dataRetrieved = [];
  
        //Retrieve data for each data ID
        for(let dataId of dataIds) {
          let data = await findData('data', dataId);
          if (data) {
            dataRetrieved.push(data);
          }
        }

        let reformattedData = reformatDataForEntryDisplay(dataRetrieved);
  
        if (dataRetrieved.length > 0) {
          //If data is retrieved successfully, return 200 response code 
          return resp.status(200).send(reformattedData);
        }
        else {
          //If data is not retrieved successfully, return 404 response code 
          return resp.status(404).send('No data found for the provided IDs');
        }
      }
      //If no ID is provided, retrieve all datta 
      else {
          let data = await findAllData();
          
          //print the protocol of the first element in the data array //payload: { time_data_captured: [Object], data: [Object], protocol: 'NMEA' }
          // Lets reformat the Data to unpack the objects

          let reformattedData = reformatData(data);

          //If data are retrieved successfully, return 200 response code
          return resp.status(200).send(reformattedData);
      }
    } 
    catch (e) {
      //If there is an error, return 500 response code
      resp.status(500).send('Server Error');
    }
}

//API Handler for get '/latestData' to retrieve the latest data entry for each unique label
export async function getLatestData(req, resp) {
    try {
      //Retrieve all data
      let data = await findAllData();
  
      //Create a map to store the latest data entry for each unique label
      let latestData = new Map();
  
      //Iterate over all data entries
      for (let dataEntry of data) {
        let label = dataEntry.payload.data.label;
  
        //If the label is not in the map, add it
        if (!latestData.has(label)) {
          latestData.set(label, dataEntry);
        }
        else {
          //If the label is in the map, compare the time data captured
          let existingData = latestData.get(label);
          let newData = dataEntry;
  
          //If the new data has a later time data captured, replace the existing data
          if (newData.payload.timeDataCaptured > existingData.payload.timeDataCaptured) {
            latestData.set(label, newData);
          }
        }
      }
  
      //Convert the map to an array and return the latest data entry for each unique label
      let latestDataArray = Array.from(latestData.values());

      //Lets reformat the Data to unpack the objects
      let reformattedData = reformatData(latestDataArray);
  
      //If data are retrieved successfully, return 200 response code
      return resp.status(200).send(reformattedData);
    } 
    catch (e) {
      //If there is an error, return 500 response code
      resp.status(500).send('Server Error');
    }
}

export async function getLabelSpecificData(req, resp) {
    try {
      //Retrieve the label from the request query
      let label = req.query.label;
  
      //Check if the required field was passed in the request body
      if (!label) {
        return resp.status(400).send('Label is required.');
      }
      
      //Get all data for the specific label
      let data = await findDataByLabel('data', label);

      //Lets reformat the Data to unpack the objects
      let reformattedData = reformatData(data);
  
      //If data are retrieved successfully, return 200 response code
      return resp.status(200).send(reformattedData);
    } 
    catch (e) {
      //If there is an error, return 500 response code
      resp.status(500).send('Server Error');
    }
}

export async function getLabelSpecificDataForPlottingByTimeForTheLastHour(req, resp) {
  try {
    //Retrieve the label from the request query
    let label = req.query.label;

    //Check if the required field was passed in the request body
    if (!label) {
      return resp.status(400).send('Label is required.');
    }
    // Retrieve all data using the label
    let data = await findDataByLabel('data', label);  

    // Reformat the data to unpack the objects
    let reformattedData = reformatDataPlot(data, label);

    //Filter the data to get all data entries with the specified label
    let labelSpecificDataForPlotting = reformattedData.filter(dataEntry => dataEntry.timeDataCaptured > Date.now() - 3600000);

    //If data are retrieved successfully, return 200 response code
    return resp.status(200).send(labelSpecificDataForPlotting);
  } 
  catch (e) {
    //If there is an error, return 500 response code
    resp.status(500).send('Server Error');
  }
}

//Helper function to reformat the data
function reformatData(data) {
  let reformattedData = [];
  for (let i = 0; i < data.length; i++) {

    // Get Time Data Captured
    let timeDataCaptured = data[i].payload.timeDataCaptured

    let payload = data[i].payload.data;

    // Extract the label
    let label = payload.label;         

    // Extract and process all data entries
    let dataEntries = payload.data.map(entry => {
        // Remove the "@type" field and format key-value pairs
        let { ['@type']: _, ...values } = entry;
        return Object.entries(values).map(([key, value]) => `${key}: ${value}`).join(", ");
    });

    // Join multiple entries into a single string
    let dataValue = dataEntries.join(" | ");

    // Construct the new format
    let newEntry = {
        _id: data[i]._id,
        timeDataCaptured: timeDataCaptured,
        label: label,
        dataValue: dataValue
    };
    reformattedData.push(newEntry);
  }
  return reformattedData;
}


//Helper function to reformat the data for plotting
function reformatDataPlot(data, label) {
  let reformattedData = [];
  for (let i = 0; i < data.length; i++) {

    // Get Time Data Captured
    let timeDataCaptured = data[i].payload.timeDataCaptured

    let dataValue = data[i].payload.data.data[0][label];

    // Construct the new format
    let newEntry = {
        _id: data[i]._id,
        timeDataCaptured: timeDataCaptured,
        dataValue: dataValue
    };
    reformattedData.push(newEntry);
  }
  return reformattedData;
}

function reformatDataForEntryDisplay(data) {
  let reformattedData = [];
  for (let i = 0; i < data.length; i++) {
    //Get Relvant fields from the Metadata
    let boardIdMsgOrigin = data[i].metadata.boardIdMsgOrigin;

    //Get Relay Chain Entry Array
    let relayChain = data[i].metadata.relayChain;

    //Get the Digital Signature
    let digitalSignature = data[i].metadata.digitalSignature;

    // Get Relevant fields from the Payload
    let timeDataCaptured = data[i].payload.timeDataCaptured

    let payload = data[i].payload.data;
    let label = payload.label;
    let dataEntries = payload.data.map(entry => {
      let { ['@type']: _, ...values } = entry;
      return Object.entries(values).map(([key, value]) => `${key}: ${value}`).join(", ");
    });
    let dataValue = dataEntries.join(" | ");

    // Construct the new format
    let newEntry = {
      _id: data[i]._id,
      boardIdMsgOrigin: boardIdMsgOrigin,
      relayChain: relayChain,
      digitalSignature: digitalSignature,
      timeDataCaptured: timeDataCaptured,
      label: label,
      dataValue: dataValue
    };
    reformattedData.push(newEntry);
  }
  return reformattedData;
}

// Simple moving average function
function smoothData(values, windowSize) {
  const smoothed = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize);
    const end = i + windowSize;
    const avg = values.slice(start, end).reduce((acc, val) => acc + val, 0) / (end - start);
    smoothed.push(avg);
  }
  return smoothed;
}