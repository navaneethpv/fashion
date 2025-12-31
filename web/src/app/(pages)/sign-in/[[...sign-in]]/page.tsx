import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-white flex justify-center items-center">
      <div className="flex items-center justify-center py-20">
        <SignIn />
      </div>
    </div>
  );
}
