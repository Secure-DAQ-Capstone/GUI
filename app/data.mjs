import time from 'date-and-time';
/**
 * Data class
 * Required Parameters:
   * @param {unsigned int} id - The id of the data
   * @param {string} sourceAddress - The IP address of the source
   * @param {string} destinationAddress - The IP address of the destination
   * @param {string} sensorType - The type of sensor
   * @param {string} sensorValue - The value of the sensor
   * @param {string} timestamp - The timestamp of the data
*/
export class Data {
  constructor(id, sourceAddress, destinationAddress, sensorType, sensorValue, timestamp) {
    this.id = id;
    this.sourceAddress = sourceAddress;
    this.destinationAddress = destinationAddress;
    this.sensorType = sensorType;
    this.sensorValue = sensorValue;
    this.timestamp = timestamp;
    }
  }