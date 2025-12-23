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
      .then(data => setUsers(data));
  }, []);
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
              <th className="px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user: any) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-900">{user.name || "Unknown"}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">Customer</span>
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}