"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Users, Mail, CheckCircle, Clock, ArrowLeft, Shield, Copy, Send, Loader2, UserPlus, Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [inviteForm, setInviteForm] = useState({ email: "", roleId: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResults, setCsvResults] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const fileInputRef = useRef(null);
  const [userStats, setUserStats] = useState({
    totalMembers: 0,
    projectManagers: 0,
    teamMembers: 0,
    salesFinance: 0
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          window.location.href = "/login";
          return;
        }
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          window.location.href = "/login";
          return;
        }
        const data = await res.json();
        if (data.role !== "admin") {
          window.location.href = "/dashboard";
        } else {
          setUser(data);
        }
      } catch (e) {
        window.location.href = "/login";
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
      fetchRoles();
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const res = await fetch("/api/admin/users/stats");
      if (res.ok) {
        const data = await res.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  };

  const fetchTeamMembers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setTeamMembers(data.users);
    }
  };

  const fetchRoles = async () => {
    setRoles([
      { id: 2, name: "project_manager" },
      { id: 3, name: "team_member" },
      { id: 4, name: "sales_finance" },
    ]);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setCreatedUser(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();

      if (res.ok) {
        const msg = data.emailSent
          ? "User created and credentials sent to their email!"
          : "User created! (Email failed - please share credentials manually)";
        toast.success(msg);
        setMessage(msg);
        setCreatedUser(data.user);
        setInviteForm({ email: "", roleId: "" });
        fetchTeamMembers();
      } else {
        toast.error(data.error || "Failed to create user");
        setMessage(data.error || "Failed to create user");
      }
    } catch (error) {
      toast.error("An error occurred");
      setMessage("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvLoading(true);
    setCsvResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/bulk-invite', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setCsvResults(data);
        toast.success(`Successfully processed ${data.successful} users!`);
        fetchTeamMembers();
        fetchUserStats();
      } else {
        toast.error(data.error || 'Failed to process CSV');
      }
    } catch (error) {
      toast.error('An error occurred while processing CSV');
      console.error(error);
    } finally {
      setCsvLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const stats = [
    { 
      label: "Total Team Members", 
      value: userStats.totalMembers.toString(), 
      change: "Active users", 
      icon: Users, 
      color: "text-blue-500" 
    },
    { 
      label: "Project Managers", 
      value: userStats.projectManagers.toString(), 
      change: "Managing projects", 
      icon: Shield, 
      color: "text-purple-500" 
    },
    { 
      label: "Team Members", 
      value: userStats.teamMembers.toString(), 
      change: "In projects", 
      icon: Users, 
      color: "text-green-500" 
    },
    { 
      label: "Sales & Finance", 
      value: userStats.salesFinance.toString(), 
      change: "Managing finance", 
      icon: CheckCircle, 
      color: "text-orange-500" 
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header with Back Button */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user.name || user.email}! Manage your team and invitations.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`p-2 rounded-lg bg-muted/50`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* Invite User Section */}
        <div className="bg-card border rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Invite New User</h2>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={csvLoading}
                className="gap-2"
                title="Upload CSV with columns: name, email"
              >
                {csvLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing CSV...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Users CSV
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="mb-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">CSV Upload Format:</p>
            <p>Upload a CSV file with three columns: <code className="bg-background px-1 py-0.5 rounded">name</code>, <code className="bg-background px-1 py-0.5 rounded">email</code>, and <code className="bg-background px-1 py-0.5 rounded">role</code>. Valid roles: <code className="bg-background px-1 py-0.5 rounded">project_manager</code>, <code className="bg-background px-1 py-0.5 rounded">team_member</code>, <code className="bg-background px-1 py-0.5 rounded">sales_finance</code>. Credentials will be emailed automatically.</p>
          </div>
          <form onSubmit={handleInvite} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  Role
                </label>
                <select
                  value={inviteForm.roleId}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleId: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name.replace(/_/g, " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="gap-2" size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-lg ${message.includes("success") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {message}
            </div>
          )}

          {createdUser && (
            <div className="mt-6 p-6 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">User Created Successfully!</p>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">Share these credentials with the new user:</p>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                  <label className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2 block">Company ID</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createdUser.companyId}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono select-all"
                    />
                    <Button
                      onClick={() => copyToClipboard(createdUser.companyId, "Company ID")}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                  <label className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2 block">Email</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createdUser.email}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm select-all"
                    />
                    <Button
                      onClick={() => copyToClipboard(createdUser.email, "Email")}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-100 dark:border-blue-900">
                  <label className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-2 block">Password (temporary)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createdUser.password}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono select-all"
                    />
                    <Button
                      onClick={() => copyToClipboard(createdUser.password, "Password")}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-xs text-blue-800 dark:text-blue-200">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Credentials have been sent to the user&apos;s email. You can also share them manually using the copy buttons above.
                  </span>
                </div>
              </div>
            </div>
          )}

          {csvResults && (
            <div className="mt-6 p-6 bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">CSV Upload Results</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-green-100 dark:border-green-900">
                  <p className="text-xs text-green-800 dark:text-green-300 font-medium mb-1">Total Processed</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">{csvResults.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-green-100 dark:border-green-900">
                  <p className="text-xs text-green-800 dark:text-green-300 font-medium mb-1">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{csvResults.successful}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-red-100 dark:border-red-900">
                  <p className="text-xs text-red-800 dark:text-red-300 font-medium mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{csvResults.failed}</p>
                </div>
              </div>

              {csvResults.errors && csvResults.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">Errors:</p>
                  <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
                    {csvResults.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-xs text-green-800 dark:text-green-200">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Credentials have been sent to all successfully created users via email.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Invitations List */}
        <div className="bg-card border rounded-xl shadow-sm">
          <div className="p-6 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">User Provisioning History</h2>
            </div>
          </div>
          {invitations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                <Mail className="w-12 h-12 opacity-50" />
              </div>
              <p className="text-lg font-medium mb-1">No users provisioned yet</p>
              <p className="text-sm">Create your first user above to get started.</p>
            </div>
          ) : (
            <div className="divide-y">
              {invitations.map((inv) => (
                <div key={inv.id} className="p-6 hover:bg-muted/30 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{inv.email}</h3>
                          <p className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                            <Shield className="w-3 h-3" />
                            {inv.role.name.replace(/_/g, " ")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">Status</p>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold ${inv.status === "accepted"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : inv.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                        >
                          {inv.status === "accepted" && <CheckCircle className="w-3 h-3" />}
                          {inv.status === "pending" && <Clock className="w-3 h-3" />}
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">Expires</p>
                        <span className="text-sm font-medium">{new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-2">Created</p>
                        <span className="text-sm font-medium">{new Date(inv.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRevokeUser(inv.userId)}
                      variant="destructive"
                      size="sm"
                      className="gap-2 shrink-0"
                      disabled={!inv.userId}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Deactivate</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
