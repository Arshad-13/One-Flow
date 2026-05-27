'use client'
import React, { useState, useEffect } from 'react'
import { Search, Filter, Loader2, Users, Edit2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function UsersManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUserId, setEditingUserId] = useState(null)
  const [editingRate, setEditingRate] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users', { credentials: 'include' })
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleEditRate = (user) => {
    setEditingUserId(user.id)
    setEditingRate(user.hourlyRate?.toString() || '0')
  }

  const handleCancelEdit = () => {
    setEditingUserId(null)
    setEditingRate('')
  }

  const handleSaveRate = async (userId) => {
    try {
      const rate = parseFloat(editingRate)
      
      if (isNaN(rate) || rate < 0) {
        toast.error('Please enter a valid hourly rate')
        return
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourlyRate: rate })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update hourly rate')
      }

      toast.success('Hourly rate updated successfully')
      setEditingUserId(null)
      setEditingRate('')
      fetchUsers()
    } catch (error) {
      console.error('Error updating hourly rate:', error)
      toast.error(error.message || 'Failed to update hourly rate')
    }
  }

  const getRoleBadgeColor = (roleName) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      project_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      team_member: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      sales_finance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
    return colors[roleName] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">Manage user hourly rates and settings</p>
      </div>

      <div className="bg-card border rounded-xl">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-card/50 backdrop-blur-sm"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'No users match your search' : 'No users in your company'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Name</th>
                  <th className="text-left p-4 font-medium text-sm">Email</th>
                  <th className="text-left p-4 font-medium text-sm">Role</th>
                  <th className="text-left p-4 font-medium text-sm">Hourly Rate ($/hr)</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="p-4 font-medium">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role?.name)}`}>
                        {user.role?.name?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingRate}
                            onChange={(e) => setEditingRate(e.target.value)}
                            className="w-24 px-2 py-1 border rounded bg-card/50 backdrop-blur-sm text-sm"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRate(user.id)
                              if (e.key === 'Escape') handleCancelEdit()
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSaveRate(user.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Save className="w-3.5 h-3.5 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-7 w-7 p-0"
                          >
                            <X className="w-3.5 h-3.5 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-medium">
                          ${Number(user.hourlyRate || 0).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      {editingUserId !== user.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRate(user)}
                          className="h-8"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit Rate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">About Hourly Rates</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Hourly rates are used to calculate timesheet values and represent the cost to the company for each hour worked. 
              These rates are used in financial calculations and reporting. Timesheets are considered company expenses (negative cash flow).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
