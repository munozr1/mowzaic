import { NavigationProvider } from './NavigationContext.jsx'
import { AuthenticationProvider } from './AuthenticationContext.jsx'
import { LoginModalProvider, useLoginModal } from './LoginModalContext.jsx'
import Router from './components/Router'
import LoginModal from './pages/Login'

function AppContent() {
	const { isOpen, closeLoginModal } = useLoginModal();
	
	return (
		<>
			<Router />
			<LoginModal isOpen={isOpen} onClose={closeLoginModal} />
		</>
	);
}

function App() {
	return (
		<AuthenticationProvider>
			<LoginModalProvider>
				<NavigationProvider>
					<AppContent />
				</NavigationProvider>
			</LoginModalProvider>
		</AuthenticationProvider>
	)
}

export default App
