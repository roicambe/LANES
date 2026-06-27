import ProfileSettings from "@/features/profile/ProfileSettings";
import SavedRoutesList from "@/features/profile/SavedRoutesList";

export default function ProfilePage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mt-10">Your Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProfileSettings />
        <SavedRoutesList />
      </div>
    </main>
  );
}
