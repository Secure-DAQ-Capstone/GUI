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
      let options = {
        projection: {
          "metadata": 1,
          "payload.timeDataCaptured": 1,
          "payload.data": 1,
          "payload.protocol": 1,
          "encryptedPayload": 1
        }
      };
      let datum = await collection.findOne({ _id: newObjectId }, options);
      await _close_collection();
      return datum;
  } 
  catch (e) {
      console.error('Error finding data:', e);
      return null;
  }
}

/**
* Description: Find data by label
 
* @param {string} cSetName - The name of the collection; the default is 'data'
* @param {string} label - The label to search for
* @returns {Array} - Returns an array of data
 */
export async function findDataByLabel(cSetName = 'data', label) {
  try {
      let collection = await _get_data_collection(cSetName);
      let options = {
        projection: {
          "payload.timeDataCaptured": 1,
          "payload.data": 1,
          "payload.protocol": 1
        }
      };
      let data = await collection.find({ "payload.data.label": label }, options).toArray();
      await _close_collection();
      return data;
  }
  catch (e) {
      console.error('Error finding data by label:', e);
      return [];
  }
}

/**
* Description: Find data fields that need to be verified based on a specific label
 
* @param {string} cSetName - The name of the collection; the default is 'data'
* @param {string} label - The label to search for
* @returns {Array} - Returns an array of data
 */
export async function findLabelSpecificVerificationFields(cSetName = 'data', label) {
  try {
      let collection = await _get_data_collection(cSetName);
      let options = {
        projection: {
          "metadata.signatureVerified": 1,
          "metadata.decryptionSucceeded": 1,
          "metadata.relayChain": 1
        }
      };
      let data = await collection.find({"payload.data.label": label}, options).toArray();
      await _close_collection();
      return data;
  }
  catch (e) {
      console.error('Error finding data by label:', e);
      return [];
  }
}

/**
* Description: Find data fields that need to be verified
 
* @param {string} cSetName - The name of the collection; the default is 'data'
* @returns {Array} - Returns an array of data
*/
export async function findAllVerificationFields(cSetName = 'data') {
  try {
      let collection = await _get_data_collection(cSetName);
      let options = {
        projection: {
          "metadata.signatureVerified": 1,
          "metadata.decryptionSucceeded": 1,
          "metadata.relayChain": 1
        }
      };
      let data = await collection.find({}, options).toArray();
      await _close_collection();
      return data;
  }
  catch (e) {
      console.error('Error finding data by label:', e);
      return [];
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
      //Include Certain fields only in the retrival
      let options = {
        projection: {
          "payload.timeDataCaptured": 1,
          "payload.data": 1,
          "payload.protocol": 1,
          "metadata.decryptionSucceeded": 1
        }
      };
      let data = await collection.find({}, options).toArray();
      await _close_collection();

      return data;
  } 
  catch (e) {
      console.error('Error retrieving data:', e);
      return [];
  }
}

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

export default { findData, findAllData, findDataByLabel, closeStore, findLabelSpecificVerificationFields, findAllVerificationFields};