import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

let mongoClient = global._mongoClient;
if (!mongoClient) {
	mongoClient = new MongoClient(uri, { maxPoolSize: 10 });
	if (process.env.NODE_ENV !== "production") {
		global._mongoClient = mongoClient;
	}
}

export async function getDb() {
	if (!mongoClient.topology || !mongoClient.topology.isConnected()) {
		await mongoClient.connect();
	}
	const dbName = process.env.MONGODB_DB;
	return mongoClient.db(dbName);
}

export { mongoClient };