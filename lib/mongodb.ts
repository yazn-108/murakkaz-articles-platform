import { MongoClient, ServerApiVersion } from "mongodb";
const uri = process.env.MONGO_URL!;
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
const clientPromise: Promise<MongoClient> =
  global._mongoClientPromise ??
  new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: false,
      deprecationErrors: true,
    },
  }).connect();
if (!global._mongoClientPromise) {
  global._mongoClientPromise = clientPromise;
}
export async function getColl({ dbName, collectionName }: { dbName: string, collectionName: string }) {
  const client = await clientPromise;
  const db = client.db(dbName);
  return db.collection(collectionName);
}
