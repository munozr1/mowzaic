import { useNavigation } from '../NavigationContext';
import  NewBookingPage from './NewBookingPage.jsx';

function Router() {
	const { path } = useNavigation();

	switch (path) {
		case '/':
			return <NewBookingPage/>;
		case '/thank-you':
			return <div>Thank You</div>;
		default:
			return <div>404 Not Found</div>;
	}
  
}

export default Router;
