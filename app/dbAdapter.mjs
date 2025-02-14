import { MongoClient, ObjectId } from 'mongodb';

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
var dbName = 'dataMarineSystem';

var testing_flag = false;
var counter = 0;

/**
* Description: Helper function to connect to data collection of the database

* @param {string} cSetName : The name of the collection; the default is 'data'
*/
async function _get_data_collection(cSetName = 'data') {
    await client.connect();
    const db = await client.db(dbName);
    return db.collection(cSetName);
}

/**
* Description: Function to close the client connection
*/
async function _close_collection() {
    await client.close();
    return 'Connection closed';
}


/**
* Description: Finds a single data by ID.

* @param {string} cSetName - The name of the collection; the default is 'data'
* @param {string} id - The ID of the data to retrieve
* @returns {Object|null} - Returns the data if found; otherwise null
*/
export async function findData(cSetName = 'data', id) {
  try {
      let collection = await _get_data_collection(cSetName);
      let newObjectId;
      if (testing_flag) {
        newObjectId = parseInt(id);
      }
      else {
        newObjectId = ObjectId.createFromHexString(id);
      }  
      // Exclude the id and DataHistoryLog field from the retrival
      // let options = { projection: { _id: 0 , DataHistoryLog: 0} };
      // let datum = await collection.findOne({ _id: newObjectId}, options);
      let datum = await collection.findOne({ _id: newObjectId});
      await _close_collection();
      return datum;
  } 
  catch (e) {
      console.error('Error finding data:', e);
      return null;
  }
}

/**
* Description: Retrieves all data from the database

* @param {string} cSetName - The name of the collection; the default is 'data'
* @returns {Array} - Returns an array of data
*/
export async function findAllData(cSetName = 'data') {
  try {
      let collection = await _get_data_collection(cSetName);
      // Exclude the DataHistoryLog field from the retrival
      // let options = { projection: {DataHistoryLog: 0} };
      // let data = await collection.find({}, options).toArray();
      //Exclude certain fields from the retrieval
      let options = {
        projection: {
          "payload.timeDataCaptured": 1,
          "payload.data": 1,
          "payload.protocol": 1
        }
      };
      let data = await collection.find({}, options).toArray();
      await _close_collection();

      // console.log(data)

      return data;
  } 
  catch (e) {
      console.error('Error retrieving data:', e);
      return [];
  }
}

/**
* Description: Retrieves the data history log for a datum

* @param {string} cSetName - The name of the collection; the default is 'data'
* @param {string} id - The ID of the data to retrieve the history for
* @returns {Array} - Returns an array of data history entries
*/
// export async function findDataHistory(cSetName = 'data', id) {
//   try {
//       let collection = await _get_data_collection(cSetName);
//       let newObjectId;
//       if (testing_flag) {
//         newObjectId = parseInt(id);
//       }
//       else {
//         newObjectId = ObjectId.createFromHexString(id);
//       }  
//       // Include the DataHistoryLog field only in the retrival
//       let options = { projection: { DataHistoryLog: 1, _id: 0 } };
//       let datumHistory = await collection.findOne({ _id: newObjectId }, options);
//       await _close_collection();
//       return datumHistory;
//   } 
//   catch (e) {
//       console.error('Error retrieving data history:', e);
//       return null;
//   }
// }

/**
* Description: Retrieves all data history entries

* @param {string} cSetName - The name of the collection; the default is 'data'
* @returns {Array} - Returns an array of data history entries
*/
// export async function findAllDataHistory(cSetName = 'data') {
//   try {
//       let collection = await _get_data_collection(cSetName);
//       // Include only the DataHistoryLog field in the retrival
//       let options = { projection: { DataHistoryLog: 1, _id: 0 } };
//       let dataHistory = await collection.find({}, options).toArray();
//       await _close_collection();
//       return dataHistory;
//   } 
//   catch (e) {
//       console.error('Error retrieving data history:', e);
//       return [];
//   }
// }

/**
* Description: Deletes a datum by ID

* @param {string} cSetName - The name of the collection; the default is 'data'
* @param {string} id - The ID of the data to delete
* @returns {Object} - Returns the delete result
*/
export async function deleteSingleData(cSetName = 'data', id) {
  try {
      let collection = await _get_data_collection(cSetName);
      let newObjectId;
      if (testing_flag) {
        newObjectId = parseInt(id);
      }
      else {
        newObjectId = ObjectId.createFromHexString(id);
      }  
      let deleteResult = await collection.deleteOne({ _id: newObjectId });
      await _close_collection();
      return deleteResult;
  } 
  catch (e) {
      console.error('Error deleting single data:', e);
      return { deletedCount: 0 };
  }
}


/*
Description: Close the database connection
*/
export async function closeStore() {
    await client.close();
    return 'Connection closed';
}



export default { findData, findAllData, deleteSingleData, closeStore};