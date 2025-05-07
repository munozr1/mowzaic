import { NavigationProvider } from './NavigationContext.jsx'
import { AuthenticationProvider } from './AuthenticationContext.jsx'
import Router from './components/Router'
// import Router from './Router'

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
