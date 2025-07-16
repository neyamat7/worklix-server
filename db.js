const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xrpsmxy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// async function connectDB() {
//   await client.connect();
//   console.log("Connected to MongoDB");
// }

function getDB() {
  return client.db("worklixDB");
}

module.exports = { getDB, client };
