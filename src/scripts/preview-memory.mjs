process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-chars';
process.env.JWT_EXPIRES_IN = '1d';
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.ADMIN_NAME = 'System Admin';
process.env.ADMIN_EMAIL = 'admin@example.com';
process.env.ADMIN_PASSWORD = 'ChangeMeAdmin123';
process.env.SEED_TEACHER_EMAIL = 'teacher@example.com';
process.env.SEED_TEACHER_PASSWORD = 'Teacher123';
process.env.SEED_STUDENT_EMAIL = 'student@example.com';
process.env.SEED_STUDENT_PASSWORD = 'Student123';
process.env.SEED_STUDENT_TWO_EMAIL = 'student2@example.com';
process.env.SEED_STUDENT_TWO_PASSWORD = 'Student123';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.PORT = '3000';

const { MongoMemoryServer } = await import('mongodb-memory-server');
const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri();

const { default: env } = await import('../config/env.js');
const { connectDatabase } = await import('../config/database.js');
const { default: app } = await import('../app.js');
const { default: User } = await import('../models/User.js');
const { default: College } = await import('../models/College.js');
const { default: Review } = await import('../models/Review.js');

await connectDatabase(env.mongodbUri, { retries: 1 });

const admin = await User.create({
  name: env.admin.name,
  email: env.admin.email,
  password: env.admin.password,
  role: 'admin',
});
const student = await User.create({
  name: 'Sample Student',
  email: env.seed.studentEmail,
  password: env.seed.studentPassword,
  role: 'student',
});
const college = await College.create({
  name: 'Riverside College',
  description: 'A sample campus used to preview the React client.',
  location: 'Riverside',
  website: 'https://riverside.example.edu',
  createdBy: admin._id,
});
await Review.create({
  collegeId: college._id,
  userId: student._id,
  rating: 5,
  comment: 'Friendly faculty and a calm campus.',
});

app.listen(env.port, () => {
  console.log(`Preview API listening on ${env.port}`);
});
