import prisma from '../../db/client';

// Fetches decrypted credentials for a given user.
// The credentials helper is called by the scheduler dispatcher.
export async function getCredentials(userId: string) {
  return prisma.userCredentials.findUnique({
    where: { user_id: userId },
  });
}
