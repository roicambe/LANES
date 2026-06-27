import ModerationTable from "@/features/admin/ModerationTable";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Moderation Queue</h1>
      <p className="text-gray-600">Review and approve flood reports here.</p>
      <ModerationTable />
    </div>
  );
}
