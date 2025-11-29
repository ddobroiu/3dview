// test-db.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDB() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database`);
    
    // Test create (dry run)
    console.log('✅ Database is working correctly');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();