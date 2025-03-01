import PageLayout from './components/NavBar.jsx'
import { NavigationProvider } from './NavigationContext.jsx'
import MainContent from './pages/MainContent.jsx'

function App() {

  return (
	  <NavigationProvider>
	  <PageLayout >
	  <MainContent/>
	  </PageLayout>
	  
	  </NavigationProvider>
  )
}

export default App
