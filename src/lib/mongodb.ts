import { MongoClient, Db } from 'mongodb';

const options = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect().catch((err) => {
      global._mongoClientPromise = undefined;
      throw err;
    });
  }

  return global._mongoClientPromise;
}

export async function getDatabase(dbName?: string): Promise<Db> {
  const client = await getMongoClient();
  const name = dbName || process.env.MONGODB_DB_NAME || 'marathi_club';
  return client.db(name);
}

export default getMongoClient;
