import { NavigationProvider } from './NavigationContext.jsx'
import { AuthenticationProvider } from './AuthenticationContext.jsx'
import Router from './components/Router'

function App() {
	return (
		<AuthenticationProvider>
			<NavigationProvider>
				<Router />
			</NavigationProvider>
		</AuthenticationProvider>
	)
}

export default App
