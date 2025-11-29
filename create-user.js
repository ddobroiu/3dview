// create-user.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  try {
    console.log('Creating test user...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com', 
        passwordHash: hashedPassword,
        credits: 50
      }
    });
    
    console.log('✅ User created:', { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      credits: user.credits 
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();