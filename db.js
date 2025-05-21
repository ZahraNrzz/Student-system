const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017/';
const client = new MongoClient(url);
const dbName = 'myDatabase';
async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        const db = client.db(dbName);
        return db;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to connect to MongoDB');
    }
}
module.exports = { connectToDatabase, client };