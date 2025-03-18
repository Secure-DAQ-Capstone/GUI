import { findData, findAllData, findDataByLabel, findLabelSpecificVerificationFields, findAllVerificationFields} from './dbAdapter.mjs';

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
        if(dataEntry.metadata.decryptionSucceeded)
        {
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
    let labelSpecificDataForPlotting = reformattedData.filter(dataEntry => new Date(dataEntry.timeDataCaptured).getTime() > Date.now() - 3600000);

    //If data are retrieved successfully, return 200 response code
    return resp.status(200).send(labelSpecificDataForPlotting);
  } 
  catch (e) {
    //If there is an error, return 500 response code
    resp.status(500).send('Server Error');
  }
}

export async function getDataNotVerified(req, resp) {
  //Look for the field in metadata that is a boolean called signatureVerified
  try{

    //Retrieve the label from the request query
    let label = req.query.label;

    //Initalize Data
    let data;

    //Check if the required field was passed in the request body
    if (!label) {
      data = await findAllVerificationFields('data');
    }
    else{
      data = await findLabelSpecificVerificationFields('data', label)
    }

    let notVerifiedDigitalSignaturesField = data.filter(dataEntry => !dataEntry.metadata.signatureVerified);
    let notSuccesfulDecryptionField = data.filter(dataEntry => !dataEntry.metadata.decryptionSucceeded);
    let relayChainTimeVerificationFilter = data.filter(dataEntry => {
      let relayChain = dataEntry.metadata.relayChain;
    
      // If relayChain is empty or has only one entry, it automatically passes
      if (!relayChain || relayChain.length <= 1) return false;
    
      // Check if timestamps are non-decreasing
      for (let i = 1; i < relayChain.length; i++) {
        if (relayChain[i].timestamp < relayChain[i - 1].timestamp) {
          return true; // This dataEntry fails the verification
        }
      }
      return false; // This dataEntry passes the verification
    });

    //Store the IDs of the not Verified Digital Signatures and  Convert the IDs to strings
    let notVerifiedDigitalSignaturesIDs = notVerifiedDigitalSignaturesField.map(dataEntry => dataEntry._id); 
    notVerifiedDigitalSignaturesIDs = notVerifiedDigitalSignaturesIDs.map(dataEntry => dataEntry.toString());

    //Store the IDs of the not Succesful Decryption and Convert the IDs to strings
    let notSuccesfulDecryptionIDs = notSuccesfulDecryptionField.map(dataEntry => dataEntry._id);
    notSuccesfulDecryptionIDs = notSuccesfulDecryptionIDs.map(dataEntry => dataEntry.toString());

    let relayChainTimeVerificationIDs = relayChainTimeVerificationFilter.map(dataEntry => dataEntry._id);
    relayChainTimeVerificationIDs = relayChainTimeVerificationIDs.map(dataEntry => dataEntry.toString());

    //Lets fetch the data for each ID in the notVerifiedDigitalSignaturesIDs
    let dataNotVerifiedDigitalSignatures = [];
    for(let dataId of notVerifiedDigitalSignaturesIDs) {
      let dataEntry = await findData('data', dataId);
      if (dataEntry && dataEntry.metadata.decryptionSucceeded) {
        dataNotVerifiedDigitalSignatures.push(dataEntry);
      }
    }
    
    let dataNotVerifiedDigitalSignaturesReformatted = reformatDataForEntryDisplay(dataNotVerifiedDigitalSignatures);

    //Lets fetch the data for each ID in the notSuccesfulDecryptionIDs
    let dataNotSuccesfulDecryption = [];
    for(let dataId of notSuccesfulDecryptionIDs) {
      let dataEntry = await findData('data', dataId);
      if (dataEntry) {
        dataNotSuccesfulDecryption.push(dataEntry);
      }
    }

    let  dataNotSuccesfulDecryptionReformatted = reformatDataForEntryDisplay(dataNotSuccesfulDecryption);

    //Lets fetch the data for each ID in the relayChainTimeVerificationIDs
    let dataRelayChainTimeVerification = [];
    for(let dataId of relayChainTimeVerificationIDs) {
      let dataEntry = await findData('data', dataId);
      if (dataEntry) {
        dataRelayChainTimeVerification.push(dataEntry);
      }
    }

    let  dataRelayChainTimeVerificationReformatted = reformatDataForEntryDisplay(dataRelayChainTimeVerification);

    // Construct the new format
    let dataNotValidated = {
      notVerifiedDigitalSignatures: dataNotVerifiedDigitalSignaturesReformatted,
      notSuccesfulDecryption: dataNotSuccesfulDecryptionReformatted,
      relayChainTimeVerification: dataRelayChainTimeVerificationReformatted
    };

    resp.status(200).send(dataNotValidated);
  }
  catch (e) {
    //If there is an error, return 500 response code
    resp.status(500).send('Server Error');
  }
};

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
    let digitalSignatureBytes = data[i].metadata.digitalSignature;

    //Get the Public Key
    let publicKey = data[i].metadata.publicKey;

    let timeDataCaptured;
    let label;
    let dataValue;
    if(data[i].metadata.decryptionSucceeded)
    {
      timeDataCaptured = data[i].payload.timeDataCaptured

      let payload = data[i].payload.data;
      label = payload.label;
      let dataEntries = payload.data.map(entry => {
        let { ['@type']: _, ...values } = entry;
        return Object.entries(values).map(([key, value]) => `${key}: ${value}`).join(", ");
      });
      // Get Relevant fields from the Payload
    
      dataValue = dataEntries.join(" | ");
    }
    else
    {
      timeDataCaptured = "";
      label = "";
      dataValue = data[i].encryptedPayload;
    }

    // Construct the new format
    let newEntry = {
      _id: data[i]._id,
      boardIdMsgOrigin: boardIdMsgOrigin,
      relayChain: relayChain,
      relayChainVerification: compareRelayChainDates(relayChain),
      digitalSignature: digitalSignatureBytes,
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

function compareRelayChainDates(relayChain) {
  for (let i = 0; i < relayChain.length - 1; i++) {
    const currentTime = relayChain[i].timestamp;
    const nextTime = relayChain[i + 1].timestamp;
    if (nextTime <= currentTime) {
      return false;
    }
  }
  return true;
}