"use client"
import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  useEffect(() => {
    fetch(`${baseUrl}/api/admin/users`)
      .then(res => res.json())
      .then(data => setUsers(data.users || []));
  }, []);

  function formatTimeAgo(dateString: string | null) {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Registered Users</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user: any) => (
              <tr key={user.id} className={user.isOnline ? "bg-green-50 hover:bg-green-100" : "hover:bg-gray-50"}>
                <td className="px-6 py-4 font-bold text-gray-900">
                  <div className="flex items-center gap-2">
                    <span>{user.name}</span>
                    {user.role === 'Administrator' && user.isOnline && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Admin • Active
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'Administrator'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-blue-50 text-blue-600'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`h-2 w-2 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                    />
                    <span className="text-gray-700">
                      {user.isOnline ? "Online" : formatTimeAgo(user.lastSeenAt)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{user.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}