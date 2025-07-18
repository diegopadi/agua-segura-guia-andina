import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { Tables } from '@/integrations/supabase/types'

type AcceleratorSession = Tables<'acelerador_sessions'>

interface AcceleratorProgress {
  accelerator1: number
  accelerator2: number
  accelerator3: number
  overall: number
}

export const useAcceleratorProgress = () => {
  const { user } = useAuth()
  const [progress, setProgress] = useState<AcceleratorProgress>({
    accelerator1: 0,
    accelerator2: 0,
    accelerator3: 0,
    overall: 0
  })
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<AcceleratorSession[]>([])

  const fetchProgress = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('acelerador_sessions')
        .select('*')
        .eq('user_id', user.id)
        .in('acelerador_number', [1, 2, 3])
        .order('updated_at', { ascending: false })

      if (error) throw error

      setSessions(data || [])

      // Calculate progress for each accelerator
      const accelerator1Session = data?.find(s => s.acelerador_number === 1)
      const accelerator2Session = data?.find(s => s.acelerador_number === 2)
      const accelerator3Session = data?.find(s => s.acelerador_number === 3)

      const calculateAcceleratorProgress = (session: AcceleratorSession | undefined): number => {
        if (!session) return 0
        if (session.status === 'completed') return 100
        
        // Each accelerator has 6 steps (including report generation)
        const totalSteps = 6
        const currentStep = session.current_step || 0
        return Math.round((currentStep / totalSteps) * 100)
      }

      const progress1 = calculateAcceleratorProgress(accelerator1Session)
      const progress2 = calculateAcceleratorProgress(accelerator2Session)
      const progress3 = calculateAcceleratorProgress(accelerator3Session)

      // Overall progress is the average of all three accelerators
      const overallProgress = Math.round((progress1 + progress2 + progress3) / 3)

      setProgress({
        accelerator1: progress1,
        accelerator2: progress2,
        accelerator3: progress3,
        overall: overallProgress
      })

    } catch (error) {
      console.error('Error fetching accelerator progress:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgress()
  }, [user?.id])

  const refreshProgress = () => {
    fetchProgress()
  }

  return {
    progress,
    loading,
    sessions,
    refreshProgress
  }
}