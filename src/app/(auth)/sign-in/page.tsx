import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = {
  title: "Sign in - Mycelium",
  description: "Sign in to your Mycelium account",
};

export default function SignInPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-3xl text-bark">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">
          The network kept growing while you were away.
        </p>
      </div>
      <SignInForm />
    </div>
  );
}
