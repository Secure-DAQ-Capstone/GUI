# GUI

### Setup and Running the Program
1. Clone the repository
2. Go into the directory `app`
```
cd app
```
3. Install the dependencies for the application using the `package.json` file
```
npm install
```
4. Start the MongoDB server for Mac is the following command:
```
brew services start mongodb-community@8.0
```
5. Run the app
```
node serve.mjs
```


## Setting Up the DB
Note: Instructions for Mac

1. Start MongoDB
```
brew services start mongodb-community@8.0
```
2. Import the information from the JSON file
```
mongoimport --db=dataMarineSystem --collection=data --file=data_mock.json --jsonArray 
```
3. Stop MongoDB
```
brew services stop mongodb-community@8.0
```
