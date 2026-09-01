import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Returns the logged-in user's id, or null.
// Single-user app today, but this keeps the door open for more users later.
export async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}
