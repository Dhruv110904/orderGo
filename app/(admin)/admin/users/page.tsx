import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, User, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const revalidate = 0; // live user list data

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  // Fetch all users
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Sellers & Users</h1>
          <p className="text-slate-400 text-sm mt-1">Manage system user profiles and authorize sellers.</p>
        </div>
        <Link href="/register">
          <Button className="bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-lg shadow-indigo-600/10">
            <UserPlus className="mr-2 h-4 w-4" />
            Register User
          </Button>
        </Link>
      </div>

      {/* Users Card List */}
      <Card className="border-slate-800 bg-slate-900/40 text-slate-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">User Accounts</CardTitle>
          <CardDescription className="text-slate-400">
            List of all administrators and sales personnel authorized to access orderGo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-950/40 border-b border-slate-850 text-slate-400">
              <TableRow className="border-b border-slate-850">
                <TableHead className="w-1/3">Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Registration Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                    No users registered.
                  </TableCell>
                </TableRow>
              ) : (
                allUsers.map((user) => (
                  <TableRow key={user.id} className="border-b border-slate-850/80 hover:bg-slate-900/20 text-slate-300 transition-colors">
                    <TableCell className="font-semibold text-white flex items-center gap-3 py-3.5">
                      <div className="h-8 w-8 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <span>{user.name}</span>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-350">{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          user.role === "admin"
                            ? "bg-indigo-950/60 border border-indigo-700/50 text-indigo-300"
                            : "bg-emerald-950/60 border border-emerald-700/50 text-emerald-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
