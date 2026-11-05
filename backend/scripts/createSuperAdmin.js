require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');

async function main() {
  const password_hash = await bcrypt.hash('Admin123!', 10);
  const user = await prisma.users.create({
    data: {
      full_name: 'Super Admin',
      email: 'superadmin@test.com',
      phone: '20171313',
      password_hash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('SuperAdmin créé, id =', user.id.toString());
}

main().catch(console.error).finally(() => prisma.$disconnect());