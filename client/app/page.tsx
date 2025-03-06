"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { user, signOut } = useAuthenticator((context) => [context.signOut, context.user]);


  useEffect(() => {
    if (user) {
      console.log("user", user);
      router.push("/dashboard");
    } else {
      router.push("/signin");
    }
  }, [user, router]);

  return (
    <div className="h-full w-full">
      <Navbar />
      <main className={`min-h-screen flex w-full flex-col items-center justify-center`}>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <h1 className="text-4xl font-bold">AI Care Manager</h1>
          {user?.username && <p className="text-sm">Welcome back, {user?.username.toUpperCase()}</p>}
          {user?.username && <Button
            size={"sm"}
            onClick={signOut}>Sign Out</Button>}
        </div>
      </main>
    </div>
  );
}
