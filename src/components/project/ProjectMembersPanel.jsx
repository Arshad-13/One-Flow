'use client'
import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function ProjectMembersPanel({ projectId, userRole }) {
  const [members, setMembers] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [memberRole, setMemberRole] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState(null)

  useEffect(() => {
    fetchMembers()
  }, [projectId])

  useEffect(() => {
    if (isAddDialogOpen) {
      fetchAvailableUsers()
    }
  }, [isAddDialogOpen])

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      } else {
        toast.error('Failed to fetch project members')
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Error loading project members')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/available-users`)
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data)
      } else {
        toast.error('Failed to fetch available users')
      }
    } catch (error) {
      console.error('Error fetching available users:', error)
      toast.error('Error loading available users')
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(selectedUserId),
          role: memberRole || null
        }),
      })

      if (response.ok) {
        const newMember = await response.json()
        setMembers([newMember, ...members])
        setIsAddDialogOpen(false)
        setSelectedUserId('')
        setMemberRole('')
        toast.success('Team member added successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add team member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Error adding team member')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this team member from the project?')) {
      return
    }

    setRemovingMemberId(userId)
    try {
      const response = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMembers(members.filter(m => m.user.id !== userId))
        toast.success('Team member removed successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to remove team member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Error removing team member')
    } finally {
      setRemovingMemberId(null)
    }
  }

  const canManageMembers = ['ADMIN', 'PROJECT_MANAGER'].includes(userRole?.toUpperCase())

  return (
    <div className="bg-card border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Project Team</h2>
            <p className="text-sm text-muted-foreground">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
        
        {canManageMembers && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Add a team member to this project. They will be able to log time and view project details.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select User</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No available users to add
                        </div>
                      ) : (
                        availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {user.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Role (Optional)</label>
                  <Select value={memberRole} onValueChange={setMemberRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Developer">Developer</SelectItem>
                      <SelectItem value="Designer">Designer</SelectItem>
                      <SelectItem value="QA Tester">QA Tester</SelectItem>
                      <SelectItem value="Business Analyst">Business Analyst</SelectItem>
                      <SelectItem value="Consultant">Consultant</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Optional: Specify their role in this project
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setSelectedUserId('')
                    setMemberRole('')
                  }}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddMember} disabled={isAdding || !selectedUserId}>
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Member
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-2">No team members yet</p>
          {canManageMembers && (
            <p className="text-sm text-muted-foreground">
              Click &ldquo;Add Member&rdquo; to assign team members to this project
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-background border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  {member.user.firstName?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                  {member.user.lastName?.[0]?.toUpperCase() || ''}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {member.user.firstName} {member.user.lastName}
                    </h3>
                    {member.role && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                        {member.role}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    <span className="text-xs px-2 py-1 rounded bg-muted">
                      {member.user.role.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ${member.user.hourlyRate}/hr
                    </span>
                  </div>
                </div>
              </div>
              
              {canManageMembers && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.user.id)}
                  disabled={removingMemberId === member.user.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {removingMemberId === member.user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
