"use client"
import React, { useEffect, useState } from 'react'
import { FiLoader } from 'react-icons/fi'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, FileText, Search, Zap, ExternalLink, Bot } from 'lucide-react'
import { getUser, updateModels } from '@/action/user.action'
import { openRouterModelsQueryOptions } from '@/service/open-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner' // assuming you're using sonner for toasts
import { getProviderIcon } from '@/lib/provider-icons'

interface ModelBadge {
  icon: React.ReactNode
  label: string
  variant?: 'default' | 'secondary' | 'outline'
}

interface ModelCardProps {
  name: string
  description: string
  badges: ModelBadge[]
  enabled: boolean
  onToggle: (enabled: boolean) => void
  hasSearchUrl?: boolean
  showMore?: boolean
  modelKey: string
  providerIcon: React.ReactNode
}

const ModelCard: React.FC<ModelCardProps> = ({
  name,
  description,
  badges,
  enabled,
  onToggle,
  hasSearchUrl = false,
  showMore = false,
  modelKey,
  providerIcon
}) => {
  return (
    <Card className="border border-border/50 bg-card hover:bg-card/80 ">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Model Icon and Name */}
            <div className="flex items-center gap-3">
              {providerIcon}
              <h3 className="text-lg font-semibold text-foreground">{name}</h3>
            </div>

            {/* Description - Limited to 2 lines */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {badges.map((badge, index) => (
                <Badge 
                  key={index}
                  variant={badge.variant || 'secondary'}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-muted"
                >
                  {badge.icon}
                  {badge.label}
                </Badge>
              ))}
              
              {/* Search URL Link
              {hasSearchUrl && (
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground ml-auto">
                  <ExternalLink className="w-3 h-3" />
                  Search URL
                </button>
              )} */}
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex-shrink-0">
            <Switch
              checked={enabled}
              onCheckedChange={onToggle}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



// Helper function to create model ID from OpenRouter data
const createModelId = (modelId: string) => modelId

const page = () => {
  const [filters, setFilters] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const { data: openRouterModels, isLoading: isLoadingOpenRouterModels, error: errorOpenRouterModels } = useQuery(openRouterModelsQueryOptions)

  // Initialize state from user data and OpenRouter models
  useEffect(() => {
    const initializeState = async () => {
      try {
        const { data: user, error } = await getUser()
        
        if (error) {
          toast.error(error)
          return
        }

        if (!openRouterModels?.data) return

        const initialFilters: Record<string, boolean> = {}
        
        // Get user's selected models
        const userSelectedModels = user?.models?.selected || []

        // Initialize all OpenRouter models with their states
        openRouterModels.data.forEach((model: any) => {
          // Check if this model is selected by user
          initialFilters[model.id] = userSelectedModels.includes(model.id)
        })

        setFilters(initialFilters)
      } catch (error) {
        console.error('Error initializing state:', error)
        toast.error('Failed to load user preferences')
      } finally {
        setLoading(false)
      }
    }

    if (openRouterModels?.data) {
      initializeState()
    }
  }, [openRouterModels])

  const handleToggle = (modelKey: string) => async (enabled: boolean) => {
    setFilters(prev => ({ ...prev, [modelKey]: enabled }))
    await updateUserModels(modelKey, enabled)
  }

  const updateUserModels = async (modelKey: string, value: boolean) => {
    if (updating) return
    
    setUpdating(true)
    try {
      // Get current selected models
      const currentSelected = Object.entries(filters)
        .filter(([key, selected]) => selected)
        .map(([key]) => key)
        .filter(Boolean)

      // Update the selected array
      let newSelected = [...currentSelected]

      if (value && !newSelected.includes(modelKey)) {
        newSelected.push(modelKey)
      } else if (!value) {
        newSelected = newSelected.filter(id => id !== modelKey)
      }

      const { error } = await updateModels({ selected: newSelected })
      
      if (error) {
        throw new Error(error)
      }
    } catch (error) {
      console.error('Error updating models:', error)
      toast.error('Failed to update model selection')
      
      // Revert the UI state on error
      setFilters(prev => ({ ...prev, [modelKey]: !value }))
    } finally {
      setUpdating(false)
    }
  }

  // Helper function to get badges based on model capabilities
  const getModelBadges = (model: any) => {
    const badges: ModelBadge[] = []
    
    // Check for vision capability
    if (model.architecture?.input_modalities?.includes('image')) {
      badges.push({ icon: <Eye className="w-3 h-3" />, label: "Vision" })
    }
    
    // Check for file support
    if (model.architecture?.input_modalities?.includes('file')) {
      badges.push({ icon: <FileText className="w-3 h-3" />, label: "Files" })
    }
    
    // Check for reasoning capability
    if (model.supported_parameters?.includes('reasoning')) {
      badges.push({ icon: <Search className="w-3 h-3" />, label: "Reasoning" })
    }
    
    return badges
  }

  // Map the OpenRouter models data to the component format
  const models = openRouterModels?.data?.map((model: any) => ({
    name: model.name,
    description: model.description || 'No description available',
    badges: getModelBadges(model),
    enabled: filters[model.id] || false,
    onToggle: handleToggle(model.id),
    hasSearchUrl: true,
    showMore: true,
    modelKey: model.id,
    providerIcon: getProviderIcon(model.id),
  })) || []

  const handleSelectRecommended = async () => {
    if (updating || !openRouterModels?.data) return
    
    setUpdating(true)
    try {
      const recommendedFilters: Record<string, boolean> = {}
      const allModelIds: string[] = []
      
      openRouterModels.data.forEach((model: any) => {
        recommendedFilters[model.id] = true
        allModelIds.push(model.id)
      })
      
      setFilters(recommendedFilters)
      
      const { error } = await updateModels({ selected: allModelIds })
      if (error) {
        throw new Error(error)
      }
      
    } catch (error) {
      console.error('Error selecting recommended models:', error)
      toast.error('Failed to select recommended models')
    } finally {
      setUpdating(false)
    }
  }

  const handleUnselectAll = async () => {
    if (updating || !openRouterModels?.data) return
    
    setUpdating(true)
    try {
      const emptyFilters: Record<string, boolean> = {}
      openRouterModels.data.forEach((model: any) => {
        emptyFilters[model.id] = false
      })
      
      setFilters(emptyFilters)
      
      const { error } = await updateModels({ selected: [] })
      if (error) {
        throw new Error(error)
      }
      
    } catch (error) {
      console.error('Error unselecting models:', error)
      toast.error('Failed to unselect models')
    } finally {
      setUpdating(false)
    }
  }

  if (isLoadingOpenRouterModels || loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <FiLoader className="animate-spin text-xl" />
        </div>
      </div>
    )
  }

  if (errorOpenRouterModels) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Available Models</h1>
          <p className="text-red-500">Error loading models. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Available Models</h1>
        <p className="text-muted-foreground">
          Choose which models appear in your model selector. This won't affect existing conversations.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled size="sm" className="text-sm md:block hidden">
          Filter by features
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={handleSelectRecommended}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Select All Models'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={handleUnselectAll}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Unselect All'}
          </Button>
        </div>
      </div>

      {/* Models List */}
      <div className="space-y-4 h-96 overflow-y-auto">
        {models.map((model: any, index: number) => (
          <ModelCard key={model.modelKey} {...model} />
        ))}
      </div>
    </div>
  )
}

export default page