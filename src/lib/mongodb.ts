import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  // In development before user sets MONGODB_URI, provide a placeholder promise that explains the missing env var
  clientPromise = Promise.reject(
    new Error('Please define the MONGODB_URI environment variable inside .env.local')
  );
} else if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDatabase(dbName?: string): Promise<Db> {
  const client = await getMongoClient();
  const name = dbName || process.env.MONGODB_DB_NAME || 'marathi_club';
  return client.db(name);
}

export default clientPromise;
