require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URL;

async function testConnection() {
  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();

    console.log("✅ SUCCESS: Connected to MongoDB!");

    const dbs = await client.db().admin().listDatabases();
    console.log("Databases:", dbs.databases);

  } catch (err) {
    console.error("❌ ERROR:", err);
  } finally {
    await client.close();
  }
}

testConnection();