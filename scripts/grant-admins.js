require("dotenv").config();
const { MongoClient } = require("mongodb");

async function main() {
  const emails = [...new Set(process.argv.slice(2).map((email) => email.trim().toLowerCase()).filter(Boolean))];
  if (!emails.length) throw new Error("Usage: npm run grant-admin -- email@example.com [...]");
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    const users = client.db(process.env.MONGODB_DB_NAME || "marathi_club").collection("users");
    const now = new Date();
    await Promise.all(emails.map((email) => users.updateOne(
      { email },
      { $set: { role: "admin", updatedAt: now }, $setOnInsert: { email, createdAt: now } },
      { upsert: true },
    )));
    console.log(`Granted admin role to ${emails.join(", ")}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => { console.error(error.message); process.exit(1); });
