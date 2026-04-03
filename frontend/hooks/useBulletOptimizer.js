/**
 * useBulletOptimizer Hook
 * ========================
 * Handles all state for the standalone Bullet Point Optimizer tool.
 * Maintains history of optimized bullets for the current session.
 */
import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { optimizeBullet } from '@/services/api'
import useStore from '@/src/store'

export function useBulletOptimizer() {
  const {
    bulletInput, bulletContext,
    setBulletResults, setBulletLoading, setBulletError,
    bulletLoading,
  } = useStore()

  const optimize = useCallback(async () => {
    if (!bulletInput.trim()) {
      toast.error('Please enter a bullet point to optimize.')
      return
    }
    if (bulletInput.trim().length < 10) {
      toast.error('Bullet point is too short — add more detail.')
      return
    }

    setBulletLoading(true)
    setBulletError(null)

    try {
      const result = await optimizeBullet(
        bulletInput.trim(),
        bulletContext.trim() || null,
      )
      setBulletResults(result.versions)
      toast.success('3 enhanced versions ready!')
    } catch (err) {
      setBulletError(err.message)
      toast.error('Optimization failed — please try again.')
    } finally {
      setBulletLoading(false)
    }
  }, [bulletInput, bulletContext])

  return { optimize, isLoading: bulletLoading }
}
