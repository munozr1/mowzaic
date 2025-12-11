import { NavigationProvider } from './NavigationContext.jsx'
import { AuthenticationProvider } from './AuthenticationContext.jsx'
import { LoginModalProvider, useLoginModal } from './LoginModalContext.jsx'
import Router from './components/Router'
import AuthModal from './pages/Login'

function AppContent() {
	const { isOpen, mode, closeLoginModal, switchMode } = useLoginModal();
	
	return (
		<>
			<Router />
			<AuthModal 
				isOpen={isOpen} 
				onClose={closeLoginModal} 
				mode={mode}
				onSwitchMode={switchMode}
			/>
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
