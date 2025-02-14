import { findData, findAllData, deleteSingleData} from './dbAdapter.mjs';

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
  
        if (dataRetrieved.length > 0) {
          //If data is retrieved successfully, return 200 response code 
          return resp.status(200).send(dataRetrieved);
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

          //If data are retrieved successfully, return 200 response code
          return resp.status(200).send(reformattedData);
      }
    } 
    catch (e) {
      //If there is an error, return 500 response code
      resp.status(500).send('Server Error');
    }
  }

//API Handler for delete '/data' to delete a data if an ID is provided.
export async function deleteData(req, resp) {
    try {
        let dataIds = req.query.id;
  
        //Determine if the required field was passed in the request body
        if (!dataIds) {
          return resp.status(400).send('At least ONE id is required.');
        }
  
        //Check if the provided parameter is an array or single value
        if (dataIds) {
            if (!Array.isArray(dataIds)) {
                dataIds = [dataIds];
            }
  
            let deleteResult;
  
            for (let dataId of dataIds) {
              deleteResult = await deleteSingleData('data', dataId);
            }
  
            if (deleteResult.deletedCount > 0) {
              //If data is deleted successfully, return 200 response code
              return resp.status(200).send(`Data Deleted`);
            } 
            else {
              //If data is not deleted successfully, return 404 response code
              return resp.status(404).send('No data found for the provided IDs');
            }
        }
    } 
    catch (e) {
      //If there is an error, return 500 response code
      resp.status(500).send('Server Error');
    }
  }