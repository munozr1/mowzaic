import { NavigationProvider } from './NavigationContext.jsx'
import Router from './pages/Page.jsx'

function App() {

  return (
	  <NavigationProvider>
	  <Router />
	  </NavigationProvider>
  )
}

export default App
