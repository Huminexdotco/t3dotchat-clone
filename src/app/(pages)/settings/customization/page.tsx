'use client'

import React, { useState, useEffect } from 'react'
import { FiLoader } from 'react-icons/fi'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { getUser, updateT3ChatInfo } from '@/action/user.action'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import VisualOptions from '@/components/settings/VisualOptions'

const suggestedTraits = [
  'friendly', 'witty', 'concise', 'curious', 'empathetic'
]

export default function CustomizationPage() {
  const [name, setName] = useState('')
  const [occupation, setOccupation] = useState('')
  const [traits, setTraits] = useState<string[]>([])
  const [newTrait, setNewTrait] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  
  // Original values to track changes
  const [originalData, setOriginalData] = useState({
    name: '',
    occupation: '',
    traits: [] as string[],
    additionalInfo: ''
  })

  const queryClient = useQueryClient()

  // Fetch user data using TanStack Query
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const result = await getUser()
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    }
  })

  // Update user data mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      username: string
      profession: string
      skills: string[]
      additionalInfo: string
    }) => {
      const result = await updateT3ChatInfo(data)
      if (result.error) {
        throw new Error(result.error)
      }
      return result.data
    },
    onSuccess: () => {
      // Update original data to reflect saved state
      const newOriginalData = {
        name,
        occupation,
        traits: [...traits],
        additionalInfo
      }
      setOriginalData(newOriginalData)
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      console.error('Error saving preferences:', error)
    }
  })

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (userData && userData.t3ChatInfo) {
      const { username, profession, skills, additionalInfo: addInfo } = userData.t3ChatInfo
      
      const formData = {
        name: username || '',
        occupation: profession || '',
        traits: skills || [],
        additionalInfo: addInfo || ''
      }
      
      setName(formData.name)
      setOccupation(formData.occupation)
      setTraits(formData.traits)
      setAdditionalInfo(formData.additionalInfo)
      setOriginalData(formData)
    }
  }, [userData])

  // Check if there are changes to enable/disable save button
  const hasChanges = () => {
    return (
      name !== originalData.name ||
      occupation !== originalData.occupation ||
      JSON.stringify(traits) !== JSON.stringify(originalData.traits) ||
      additionalInfo !== originalData.additionalInfo
    )
  }

  const addTrait = (trait: string) => {
    if (trait.trim() && !traits.includes(trait.trim()) && traits.length < 50) {
      setTraits([...traits, trait.trim()])
      setNewTrait('')
    }
  }

  const removeTrait = (traitToRemove: string) => {
    setTraits(traits.filter(trait => trait !== traitToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      addTrait(newTrait)
    }
  }

  const addSuggestedTrait = (trait: string) => {
    if (!traits.includes(trait) && traits.length < 50) {
      setTraits([...traits, trait])
    }
  }

  const handleSave = () => {
    updateMutation.mutate({
      username: name,
      profession: occupation,
      skills: traits,
      additionalInfo: additionalInfo
    })
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <FiLoader className="animate-spin text-xl" />
        </div>
      </div>
    )
  }


  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-foreground mb-8">Customize T4 Chat</h1>
      
      <div className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">
            What should T4 Chat call you?
          </Label>
          <div className="relative">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 50))}
              className="pr-16"
              placeholder="Enter your name"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {name.length}/50
            </span>
          </div>
        </div>

        {/* Occupation Field */}
        <div className="space-y-2">
          <Label htmlFor="occupation" className="text-base">
            What do you do?
          </Label>
          <div className="relative">
            <Input
              id="occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value.slice(0, 100))}
              className="pr-20"
              placeholder="Enter your occupation"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {occupation.length}/100
            </span>
          </div>
        </div>

        {/* Traits Field */}
        <div className="space-y-3">
          <Label className="text-base">
            What traits should T4 Chat have?{' '}
            <span className="text-sm text-muted-foreground font-normal">
              (up to 50, max 100 chars each)
            </span>
          </Label>
          
          {/* Current Traits */}
          <div className="flex flex-wrap gap-2 min-h-[2rem]">
            {traits.map((trait, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="flex items-center gap-1 px-3 py-1"
              >
                {trait}
                <button
                  onClick={() => removeTrait(trait)}
                  className="ml-1 dark:hover:bg-zinc-600 hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add New Trait Input */}
          <div className="relative">
            <Input
              value={newTrait}
              onChange={(e) => setNewTrait(e.target.value.slice(0, 100))}
              onKeyDown={handleKeyPress}
              placeholder="Type a trait and press Enter or Tab..."
              className="pr-16"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {traits.length}/50
            </span>
          </div>

          {/* Suggested Traits */}
          <div className="flex flex-wrap gap-2">
            {suggestedTraits.map((trait) => (
              <Button
                key={trait}
                variant="outline"
                size="sm"
                onClick={() => addSuggestedTrait(trait)}
                disabled={traits.includes(trait) || traits.length >= 50}
                className="text-sm disabled:opacity-50"
              >
                {trait}
                <span className="ml-1 text-lg">+</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Additional Info Field */}
        <div className="space-y-2">
          <Label htmlFor="additional" className="text-base">
            Anything else T4 Chat should know about you?
          </Label>
          <div className="relative">
            <Textarea
              id="additional"
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value.slice(0, 3000))}
              className="min-h-[120px] pr-20 resize-none"
              placeholder="Tell us more about yourself..."
            />
            <span className="absolute bottom-3 right-3 text-sm text-muted-foreground">
              {additionalInfo.length}/3000
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button 
          variant="outline" 
        >
          Load Legacy Data
        </Button>
        <Button 
          variant="t3"
          className="ml-auto"
          disabled={!hasChanges() || updateMutation.isPending}
          onClick={handleSave}
        >
          Save Preferences
        </Button>
      </div>

      {/* Visual Options Section */}
      <VisualOptions />
    </div>
  )
}