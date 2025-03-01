import { useNavigation } from '../NavigationContext';
import  NewBookingPage from './NewBookingPage.jsx';
import LandingPage from './LandingPage.jsx';

function MainContent() {
	const { path, navigate } = useNavigation();
	const route = path.split('?')[0]
	if (route == '/') navigate('/');

	const renderMain = () => {
		switch (route) {
			case '/':
				return <LandingPage/>
			case '/book':
				return <NewBookingPage/>;
			case '/thank-you':
				return <div>Thank You</div>;
			default:
				return <div>404 Not Found</div>;
		}
	}


	return (
		<>
		{renderMain()}
		</>

	)
  
}

export default MainContent;
