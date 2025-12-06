import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { faker } from '@faker-js/faker';
import { User } from '../src/models/User';

dotenv.config();

const seedUsers = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Connected to MongoDB...');

    // Optional: Clear existing users
    // await User.deleteMany({}); 

    const users = [];
    for (let i = 0; i < 20; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      users.push({
        clerkId: `user_mock_${faker.string.uuid()}`,
        email: faker.internet.email({ firstName, lastName }),
        name: `${firstName} ${lastName}`,
        role: 'user', // Most are customers
        avatar: faker.image.avatar(),
        createdAt: faker.date.past(),
        addresses: [
          {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zip: faker.location.zipCode(),
            country: 'US',
            isDefault: true
          }
        ]
      });
    }

    await User.insertMany(users);
    console.log(`✅ Successfully seeded ${users.length} users!`);
    process.exit();
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();