import { MongoClient, ObjectId } from "mongodb";

const globalForMongo = globalThis;

export async function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");
  const client = globalForMongo.mongoClient || new MongoClient(uri);
  if (process.env.NODE_ENV !== "production") globalForMongo.mongoClient = client;
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || "marathi_club");
  if (!globalForMongo.indexesEnsured) {
    globalForMongo.indexesEnsured = db
      .collection("votes")
      .createIndex({ voterEmail: 1, category: 1 }, { unique: true })
      .catch(() => {});
  }
  await globalForMongo.indexesEnsured;
  return db;
}

// legacy entries migrated from the Express app use UUID string ids
export function toId(id) {
  return /^[a-f\d]{24}$/i.test(id) ? new ObjectId(id) : String(id);
}
