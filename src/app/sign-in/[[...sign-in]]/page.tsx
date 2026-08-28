import { SignIn } from "@clerk/nextjs";
import { TechBrainBackground } from "@/components/tech-brain-background";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-5">
      <TechBrainBackground />
      <SignIn />
    </div>
  );
}
