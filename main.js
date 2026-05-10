
import  prisma  from "./lib/prisma.js";
async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'Test User',
      email: 'test@uni.edu',
      password: 'password123',
      role: 'community_member'
    }
  });
  console.log('Created user:', user);
}
