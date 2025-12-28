import { SignIn } from "@clerk/nextjs";
import Navbar from "@/app/(pages)/components/Navbar";

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      {/* <Navbar /> */}
      <div className="flex items-center justify-center py-20">
        <SignIn />
      </div>
    </div>
  );
}
