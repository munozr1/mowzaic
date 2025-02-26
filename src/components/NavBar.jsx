

function NavBar() {
  const navigationOptions = ['Book', 'About'];

  return (
    <>
	<nav className="w-full flex justify-between h-[3.5rem] bg-green-500 text-center items-center border-gray-200 bg-gray-900">
	  <div className="p-2">
	  	<h1 className="text-white text-2xl font-bold">mowzaic</h1>
	  </div>
	  <div className="p-4">
	  <ul className="flex space-x-4">
	  	{navigationOptions.map((option, index) => (
			<li key={index} className="text-white text-lg font-semibold">
			{option}
			</li>
		))}
	  </ul>
	  </div>
	  
	</nav>

    </>
  )
}

export default NavBar
