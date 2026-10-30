import { TridentProvider } from './context/TridentProvider'
import { AppShell } from './components/layout/AppShell'

export default function App() {
  return (
    <TridentProvider>
      <AppShell />
    </TridentProvider>
  )
}
