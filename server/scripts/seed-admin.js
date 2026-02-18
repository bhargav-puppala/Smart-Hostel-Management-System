require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/modules/users/user.model');
const { ROLES } = require('../src/shared/constants');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostlr');
    const existing = await User.findOne({ email: 'admin@hostlr.com' });
    if (existing) {
      console.log('Admin user already exists');
      process.exit(0);
      return;
    }
    await User.create({
      name: 'Admin',
      email: 'admin@hostlr.com',
      password: 'admin123',
      role: ROLES.ADMIN,
    });
    console.log('Admin user created: admin@hostlr.com / admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seedAdmin();
