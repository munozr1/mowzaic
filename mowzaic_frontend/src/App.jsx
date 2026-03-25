import { NavigationProvider } from './NavigationContext.jsx'
import { AuthenticationProvider, useAuthentication } from './AuthenticationContext.jsx'
import { LoginModalProvider, useLoginModal } from './LoginModalContext.jsx'
import Router from './components/Router'
import AuthModal from './pages/Login'
import CompleteProfileModal from './components/CompleteProfileModal'

function AppContent() {
	const { isOpen, mode, closeLoginModal, switchMode } = useLoginModal();
	const { needsProfileCompletion, checkProfileCompletion, user } = useAuthentication();
	
	const handleProfileComplete = () => {
		// Re-check profile completion status
		if (user) {
			checkProfileCompletion(user.id);
		}
	};
	
	return (
		<>
			<Router />
			<AuthModal 
				isOpen={isOpen} 
				onClose={closeLoginModal} 
				mode={mode}
				onSwitchMode={switchMode}
			/>
			<CompleteProfileModal
				isOpen={needsProfileCompletion}
				onComplete={handleProfileComplete}
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
