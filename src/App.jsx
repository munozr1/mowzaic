import PageLayout from './components/NavBar.jsx'
import { NavigationProvider } from './NavigationContext.jsx'
import MainContent from './pages/MainContent.jsx'
import LandingPage from './pages/LandingPage.jsx'

function App() {
	const hasVisited = localStorage.getItem('hasVisited')
	console.log(hasVisited)
	
	return (
		<NavigationProvider>
			{!hasVisited ? (
				<LandingPage />
			) : (
				<PageLayout>
					<MainContent />
				</PageLayout>
			)}
		</NavigationProvider>
	)
}

export default App
