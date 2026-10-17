import env from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/User.js';
import College from '../models/College.js';
import Review from '../models/Review.js';

async function upsertUser({ name, email, password, role }) {
  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    user = await User.create({ name, email, password, role });
    return user;
  }

  let changed = false;
  if (user.name !== name) {
    user.name = name;
    changed = true;
  }
  if (user.role !== role) {
    user.role = role;
    changed = true;
  }
  if (changed) {
    await user.save();
  }
  return user;
}

async function upsertCollege(payload, createdBy) {
  const nameNormalized = payload.name.trim().toLowerCase();
  const locationNormalized = payload.location.trim().toLowerCase();
  const existing = await College.findOne({ nameNormalized, locationNormalized });
  if (existing) {
    return existing;
  }
  return College.create({ ...payload, createdBy });
}

async function upsertReview({ collegeId, userId, rating, comment }) {
  const existing = await Review.findOne({ collegeId, userId });
  if (existing) {
    existing.rating = rating;
    existing.comment = comment;
    await existing.save();
    return existing;
  }
  return Review.create({ collegeId, userId, rating, comment });
}

async function seed() {
  if (!env.admin.password) {
    throw new Error('ADMIN_PASSWORD must be set before running the seed script');
  }

  await connectDatabase(env.mongodbUri, { retries: 5, delayMs: 1000 });

  const admin = await upsertUser({
    name: env.admin.name,
    email: env.admin.email,
    password: env.admin.password,
    role: 'admin',
  });

  const teacher = await upsertUser({
    name: 'Sample Teacher',
    email: env.seed.teacherEmail,
    password: env.seed.teacherPassword,
    role: 'teacher',
  });

  const student = await upsertUser({
    name: 'Sample Student',
    email: env.seed.studentEmail,
    password: env.seed.studentPassword,
    role: 'student',
  });

  const studentTwo = await upsertUser({
    name: 'Second Student',
    email: env.seed.studentTwoEmail,
    password: env.seed.studentTwoPassword,
    role: 'student',
  });

  const colleges = await Promise.all([
    upsertCollege({
      name: 'Massachusetts Institute of Technology',
      description: 'A private research university known for science and engineering.',
      location: 'Cambridge, MA',
      website: 'https://www.mit.edu',
    }, admin._id),
    upsertCollege({
      name: 'Stanford University',
      description: 'A research university on the San Francisco Peninsula.',
      location: 'Stanford, CA',
      website: 'https://www.stanford.edu',
    }, admin._id),
    upsertCollege({
      name: 'Indian Institute of Technology Bombay',
      description: 'A public technical university and Institute of National Importance.',
      location: 'Mumbai, India',
      website: 'https://www.iitb.ac.in',
    }, admin._id),
    upsertCollege({
      name: 'University of Oxford',
      description: 'A collegiate research university in Oxford, England.',
      location: 'Oxford, United Kingdom',
      website: 'https://www.ox.ac.uk',
    }, admin._id),
  ]);

  await upsertReview({
    collegeId: colleges[0]._id,
    userId: teacher._id,
    rating: 5,
    comment: 'Outstanding research environment and faculty support.',
  });
  await upsertReview({
    collegeId: colleges[0]._id,
    userId: student._id,
    rating: 4,
    comment: 'Challenging coursework with excellent lab facilities.',
  });
  await upsertReview({
    collegeId: colleges[1]._id,
    userId: student._id,
    rating: 5,
    comment: 'Great campus culture and strong industry connections.',
  });
  await upsertReview({
    collegeId: colleges[1]._id,
    userId: studentTwo._id,
    rating: 3,
    comment: 'Beautiful campus, but some classes are overcrowded.',
  });
  await upsertReview({
    collegeId: colleges[2]._id,
    userId: teacher._id,
    rating: 4,
    comment: 'Rigorous academics and a highly motivated student body.',
  });

  console.log('Seed completed');
  console.log(`Admin: ${admin.email}`);
  console.log(`Teacher: ${teacher.email}`);
  console.log(`Student: ${student.email}`);
  console.log(`Student two: ${studentTwo.email}`);
  console.log(`Colleges: ${colleges.length}`);
}

seed()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Seed failed');
    console.error(err.message);
    await disconnectDatabase();
    process.exit(1);
  });
