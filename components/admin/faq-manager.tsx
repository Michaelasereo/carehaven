'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Edit2, ChevronUp, ChevronDown, X } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function FAQManager() {
  const supabase = createClient()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' })
  const [displayCount, setDisplayCount] = useState<number>(4)
  const [displayCountInput, setDisplayCountInput] = useState<string>('4')
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Fetch user role
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(profile?.role || null)
      }
    }

    fetchUserRole()

    // Fetch FAQs
    const fetchFAQs = async () => {
      try {
        const response = await fetch('/api/admin/faqs')
        if (response.ok) {
          const data = await response.json()
          setFaqs(data.faqs || [])
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFAQs()

    // Fetch display count
    const fetchDisplayCount = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('faq_display_count')
          .single()
        
        if (data) {
          const count = data.faq_display_count || 4
          setDisplayCount(count)
          setDisplayCountInput(count.toString())
        }
      } catch (error) {
        console.error('Error fetching display count:', error)
      }
    }

    fetchDisplayCount()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('faqs-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'faqs',
        },
        () => {
          // Refetch FAQs when changes occur
          fetchFAQs()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
        },
        (payload) => {
          if (payload.new.faq_display_count !== undefined) {
            const count = payload.new.faq_display_count || 4
            setDisplayCount(count)
            setDisplayCountInput(count.toString())
            setSuccessMessage(`FAQ display count updated to ${count}`)
            setTimeout(() => setSuccessMessage(null), 5000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleAddFAQ = async () => {
    if (!newFAQ.question.trim() || !newFAQ.answer.trim()) {
      setError('Question and answer are required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: newFAQ.question.trim(),
          answer: newFAQ.answer.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create FAQ')
      }

      const data = await response.json()
      setFaqs([...faqs, data.faq])
      setNewFAQ({ question: '', answer: '' })
      setShowAddForm(false)
      setSuccessMessage('FAQ created successfully')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error: any) {
      setError(error.message || 'Failed to create FAQ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateFAQ = async (id: string, updates: Partial<FAQ>) => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update FAQ')
      }

      const data = await response.json()
      setFaqs(faqs.map(faq => faq.id === id ? data.faq : faq))
      setEditingId(null)
      setSuccessMessage('FAQ updated successfully')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error: any) {
      setError(error.message || 'Failed to update FAQ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete FAQ')
      }

      setFaqs(faqs.filter(faq => faq.id !== id))
      setSuccessMessage('FAQ deleted successfully')
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error: any) {
      setError(error.message || 'Failed to delete FAQ')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return

    const newFaqs = [...faqs]
    const temp = newFaqs[index].display_order
    newFaqs[index].display_order = newFaqs[index - 1].display_order
    newFaqs[index - 1].display_order = temp

    // Update both FAQs
    await handleUpdateFAQ(newFaqs[index].id, { display_order: newFaqs[index].display_order })
    await handleUpdateFAQ(newFaqs[index - 1].id, { display_order: newFaqs[index - 1].display_order })
  }

  const handleMoveDown = async (index: number) => {
    if (index === faqs.length - 1) return

    const newFaqs = [...faqs]
    const temp = newFaqs[index].display_order
    newFaqs[index].display_order = newFaqs[index + 1].display_order
    newFaqs[index + 1].display_order = temp

    // Update both FAQs
    await handleUpdateFAQ(newFaqs[index].id, { display_order: newFaqs[index].display_order })
    await handleUpdateFAQ(newFaqs[index + 1].id, { display_order: newFaqs[index + 1].display_order })
  }

  const handleUpdateDisplayCount = async () => {
    const count = parseInt(displayCountInput, 10)
    if (isNaN(count) || count < 1) {
      setError('Please enter a valid positive integer')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Get settings ID first
      const { data: settings } = await supabase
        .from('system_settings')
        .select('id')
        .single()

      if (!settings) {
        throw new Error('System settings not found')
      }

      const { error } = await supabase
        .from('system_settings')
        .update({ faq_display_count: count })
        .eq('id', settings.id)

      if (error) throw error

      setDisplayCount(count)
      setSuccessMessage(`FAQ display count set to ${count}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error: any) {
      setError(error.message || 'Failed to update display count')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading FAQs...</span>
        </div>
      </Card>
    )
  }

  const sortedFAQs = [...faqs].sort((a, b) => a.display_order - b.display_order)

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">FAQ Management</h3>
          {userRole === 'super_admin' && (
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          )}
        </div>

        {/* Display Count Setting */}
        <div className="space-y-2 border-b pb-4">
          <Label htmlFor="display-count">Number of FAQs to Display on Homepage</Label>
          <div className="flex items-center gap-2">
            <Input
              id="display-count"
              type="number"
              min="1"
              value={displayCountInput}
              onChange={(e) => {
                setDisplayCountInput(e.target.value)
                setError(null)
              }}
              className="w-24"
              disabled={userRole !== 'super_admin'}
            />
            {userRole === 'super_admin' && (
              <Button
                onClick={handleUpdateDisplayCount}
                disabled={isSaving || parseInt(displayCountInput, 10) === displayCount}
                size="sm"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Currently showing {displayCount} FAQs on the homepage
          </p>
        </div>

        {/* Add FAQ Form - Only visible to super_admin */}
        {userRole === 'super_admin' && showAddForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Add New FAQ</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddForm(false)
                  setNewFAQ({ question: '', answer: '' })
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-question">Question</Label>
              <Input
                id="new-question"
                value={newFAQ.question}
                onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                placeholder="Enter question"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-answer">Answer</Label>
              <Textarea
                id="new-answer"
                value={newFAQ.answer}
                onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                placeholder="Enter answer"
                rows={4}
              />
            </div>
            <Button
              onClick={handleAddFAQ}
              disabled={isSaving || !newFAQ.question.trim() || !newFAQ.answer.trim()}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create FAQ'
              )}
            </Button>
          </div>
        )}

        {/* FAQs List */}
        <div className="space-y-4">
          {sortedFAQs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No FAQs yet. Add your first FAQ above.</p>
          ) : (
            sortedFAQs.map((faq, index) => (
              <div
                key={faq.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {editingId === faq.id ? (
                  <EditFAQForm
                    faq={faq}
                    onSave={(updates) => handleUpdateFAQ(faq.id, updates)}
                    onCancel={() => setEditingId(null)}
                    isSaving={isSaving}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{faq.display_order + 1}</span>
                          {!faq.is_active && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Inactive</span>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{faq.question}</h4>
                        <p className="text-sm text-gray-600">{faq.answer}</p>
                      </div>
                      {userRole === 'super_admin' && (
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === sortedFAQs.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(faq.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFAQ(faq.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function EditFAQForm({
  faq,
  onSave,
  onCancel,
  isSaving,
}: {
  faq: FAQ
  onSave: (updates: Partial<FAQ>) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [question, setQuestion] = useState(faq.question)
  const [answer, setAnswer] = useState(faq.answer)
  const [isActive, setIsActive] = useState(faq.is_active)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`edit-question-${faq.id}`}>Question</Label>
        <Input
          id={`edit-question-${faq.id}`}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`edit-answer-${faq.id}`}>Answer</Label>
        <Textarea
          id={`edit-answer-${faq.id}`}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`edit-active-${faq.id}`}
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor={`edit-active-${faq.id}`} className="cursor-pointer">
          Active (show on homepage)
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onSave({ question, answer, is_active: isActive })}
          disabled={isSaving || !question.trim() || !answer.trim()}
          size="sm"
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
