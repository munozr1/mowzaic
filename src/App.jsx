import { NavigationProvider } from './NavigationContext.jsx'
import Router from './components/Router'

function App() {
	return (
		<NavigationProvider>
			<Router />
		</NavigationProvider>
	)
}

export default App
