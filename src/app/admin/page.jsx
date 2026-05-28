"use client";
import { useEffect, useState, useRef } from "react";
import { Users, Mail, CheckCircle, Clock, Shield, Copy, Send, Loader2, UserPlus, Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [inviteForm, setInviteForm] = useState({ email: "", roleId: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResults, setCsvResults] = useState(null);
  const fileInputRef = useRef(null);
  const [userStats, setUserStats] = useState({
    totalMembers: 0,
    projectManagers: 0,
    teamMembers: 0,
    salesFinance: 0
  });

  useEffect(() => {
      fetchTeamMembers();
      fetchRoles();
      fetchUserStats();
  }, []);

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
    toast.success(label + " copied to clipboard!");
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
        toast.success("Successfully processed " + data.successful + " users!");
        fetchTeamMembers();
        fetchUserStats();
      } else {
        toast.error(data.error || 'Failed to process CSV');
      }
    } catch (error) {
      toast.error('An error occurred while processing CSV');
    } finally {
      setCsvLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const stats = [
    { label: "Total Team Members", value: userStats.totalMembers.toString(), icon: Users, color: "text-blue-500" },
    { label: "Project Managers", value: userStats.projectManagers.toString(), icon: Shield, color: "text-purple-500" },
    { label: "Team Members", value: userStats.teamMembers.toString(), icon: Users, color: "text-green-500" },
    { label: "Sales & Finance", value: userStats.salesFinance.toString(), icon: CheckCircle, color: "text-orange-500" },
  ];

  return (
    <div className="p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
            <h1 className="font-serif text-4xl text-ink mb-2">Team Management</h1>
            <p className="text-ink-2">Provision access and manage organizational roles.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-card border border-rule rounded-xl p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-micro text-ink-3">{stat.label}</span>
                <stat.icon className={"w-4 h-4 " + stat.color} />
              </div>
              <div className="font-serif text-3xl text-ink">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 bg-card border border-rule rounded-xl p-8 backdrop-blur-md">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-serif text-2xl text-ink">Invite New User</h2>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={csvLoading} className="text-xs uppercase tracking-wider rounded-[7px]">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk CSV
                    </Button>
                </div>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                
                <form onSubmit={handleInvite} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-micro text-ink-3">Email Address</label>
                            <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} className="w-full h-11 px-4 border border-rule rounded-[7px] bg-background focus:ring-teal/20 outline-none" placeholder="user@oneflow.com" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-micro text-ink-3">Organizational Role</label>
                            <select value={inviteForm.roleId} onChange={(e) => setInviteForm({ ...inviteForm, roleId: parseInt(e.target.value) })} className="w-full h-11 px-4 border border-rule rounded-[7px] bg-background focus:ring-teal/20 outline-none" required>
                                <option value="">Select a role</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>{role.name.replace(/_/g, " ").toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Button type="submit" disabled={loading} className="bg-teal text-white px-8 h-11 rounded-[7px]">
                        {loading ? 'Sending...' : 'Send Invitation'}
                    </Button>
                </form>
            </div>

            <div className="bg-card border border-rule rounded-xl p-8 backdrop-blur-md">
                <h2 className="font-serif text-2xl text-ink mb-6">Recent Users</h2>
                <div className="space-y-4">
                    {teamMembers.slice(0, 5).map((member) => (
                        <div key={member.id} className="flex items-center gap-3 pb-4 border-b border-rule last:border-0">
                            <div className="w-8 h-8 rounded-full bg-teal-soft flex items-center justify-center text-teal font-bold text-xs">
                                {member.firstName?.[0] || member.email[0].toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-ink">{member.firstName} {member.lastName}</p>
                                <p className="text-[11px] text-ink-3 uppercase tracking-wider">{(member.role?.name || member.role || '').replace(/_/g, ' ')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
