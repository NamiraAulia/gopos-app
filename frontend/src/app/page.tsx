import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function RootPage() {
  const cookieStore = await cookies();
  
  const hasToken = cookieStore.get("auth_token");

  if (hasToken) {
    redirect("/cashier");
  } 
  else {
    redirect("/login");
  }
}