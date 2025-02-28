import { useNavigation } from '../NavigationContext';
import  NewBookingPage from './NewBookingPage.jsx';
import LandingPage from './LandingPage.jsx';

function Router() {
	const { path } = useNavigation();

	switch (path) {
		case '/home':
			return <LandingPage/>
		case '/':
			return <NewBookingPage/>;
		case '/thank-you':
			return <div>Thank You</div>;
		default:
			return <div>404 Not Found</div>;
	}
  
}

export default Router;
