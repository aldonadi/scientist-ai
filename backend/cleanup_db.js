const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;

if (!uri) {
    console.error('MONGO_URI not found in .env');
    process.exit(1);
}

// Ensure the URI points to the specific database 'scientist-ai' (or just use connection to drop)
// The user mentioned "scientist_ai" database. Mongoose connects to the DB specified in URI or default.
// The URI in .env is mongodb://172.16.0.153:27017. This connects to 'test' by default usually unless specified.
// We should explicitely connect to 'scientist-ai' or whatever the project uses.
// Looking at SPEC.md: "mongodb://.../scientist-ai" is example.
// The current .env has `mongodb://172.16.0.153:27017`.
// I will assume the target DB is 'scientist-ai' (or 'scientist_ai' as user typed). SPEC says scientist-ai. User said scientist_ai.
// I'll check what databases exist first perhaps? Or just try to drop both if they exist?
// Actually, let's just update the script to list dbs first to be safe, then drop 'scientist-ai' and 'scientist_ai'.

const checkAndDrop = async () => {
    try {
        const conn = await mongoose.connect(uri);
        console.log('Connected.');

        // Use the native driver access
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const result = await admin.listDatabases();
        console.log('Databases:', result.databases.map(d => d.name));

        const targetDbs = ['scientist-ai', 'scientist_ai'];

        for (const dbName of targetDbs) {
            if (result.databases.find(d => d.name === dbName)) {
                console.log(`Dropping database: ${dbName}`);
                // We need to switch to that DB to drop it
                const db = mongoose.connection.useDb(dbName);
                await db.dropDatabase();
                console.log(`Dropped ${dbName}`);
            } else {
                console.log(`Database ${dbName} not found.`);
            }
        }

        await mongoose.disconnect();
        console.log('Done.');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkAndDrop();
