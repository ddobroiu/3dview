// scripts/create-test-user.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Șterge utilizatorul test dacă există
    await prisma.user.deleteMany({
      where: { username: 'testuser' }
    });

    // Creează utilizatorul de test
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        credits: 50, // Dăm credite pentru testare
        emailVerified: new Date(), // Pre-verificat
      }
    });

    console.log('✅ Test user created successfully:');
    console.log(`   Username: testuser`);
    console.log(`   Email: test@example.com`);
    console.log(`   Password: password123`);
    console.log(`   Credits: 50`);
    console.log(`   ID: ${user.id}`);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();