import LoginForm from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow rounded-xl">
        <h1 className="text-2xl font-bold text-center">Welcome back</h1>
        <p className="text-center text-gray-500 text-sm">Log in to view your saved routes.</p>
        <LoginForm />
      </div>
    </div>
  );
}
