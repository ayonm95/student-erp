require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_erp';
    console.log(`Connecting to database at ${mongoUri.replace(/:([^@]+)@/, ':****@')}...`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB connected successfully.');

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@erp.edu').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass@123';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`[Seed Notice]: Admin user already exists with email: ${adminEmail}`);
      console.log(`Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    console.log('==============================================');
    console.log('  Admin Account Seeded Successfully!');
    console.log(`  Name:     ${adminUser.name}`);
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log(`  Role:     ${adminUser.role}`);
    console.log('==============================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]: Failed to seed admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
