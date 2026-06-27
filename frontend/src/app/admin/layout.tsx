export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar placeholder */}
      <aside className="w-full md:w-64 bg-gray-900 text-white p-4">
        <h2 className="text-xl font-bold">DRRM Admin</h2>
        <nav className="mt-4">
          <ul>
            <li className="py-2">Moderation Queue</li>
          </ul>
        </nav>
      </aside>
      
      {/* Main admin content */}
      <main className="flex-1 p-6 bg-gray-100">
        {children}
      </main>
    </div>
  );
}
