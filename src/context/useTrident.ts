import { useContext } from 'react'
import { TridentContext } from './TridentContext'

export function useTrident() {
  const context = useContext(TridentContext)
  if (!context) throw new Error('useTrident must be used within TridentProvider')
  return context
}
