import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is missing');
  process.exit(1);
}

await mongoose.connect(uri);

const db = mongoose.connection.db;

const collections = [
  'eleves',
  'formations',
  'seances',
  'presences',
  'eleveformations',
  'certifications',
  'users',
  'niveaux',
];

const counts = {};
for (const name of collections) {
  try {
    counts[name] = await db.collection(name).countDocuments();
  } catch {
    counts[name] = '(missing)';
  }
}

const seances = db.collection('seances');
const min = await seances.find().sort({ date: 1 }).limit(1).project({ date: 1 }).toArray();
const max = await seances.find().sort({ date: -1 }).limit(1).project({ date: 1 }).toArray();

const now = new Date();
const last30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
const last6mo = new Date(now.getTime() - 183 * 24 * 3600 * 1000);

const seancesLast30Days = await seances.countDocuments({ date: { $gte: last30, $lte: now } });
const seancesLast6Months = await seances.countDocuments({ date: { $gte: last6mo, $lte: now } });

console.log(
  JSON.stringify(
    {
      counts,
      seances: {
        minDate: min?.[0]?.date ?? null,
        maxDate: max?.[0]?.date ?? null,
        seancesLast30Days,
        seancesLast6Months,
        now,
      },
    },
    null,
    2
  )
);

await mongoose.disconnect();
