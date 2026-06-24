import SignupForm from "@/features/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow rounded-xl">
        <h1 className="text-2xl font-bold text-center">Create an Account</h1>
        <p className="text-center text-gray-500 text-sm">Join LANES to navigate safely.</p>
        <SignupForm />
      </div>
    </div>
  );
}
