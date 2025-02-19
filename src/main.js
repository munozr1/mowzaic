import './style.css'
import NavBar from './components/Navbar.js'
//import EditSchedules from './components/EditSchedules'


document.querySelector('#app').innerHTML = `
  <div class="mt-5">
    
    <div class="flex flex-col w-full  border-red-500 border">
    <p class="font-bold">Mow delivered</p>
    <p class="font-bold">just like that</p>
    </div>
    
    <form class="mt-8"><input class="shadow border border-red-500 p-2 rounded-sm" id='address-input' placeholder="Enter address" /></form>
    <edit-schedules/>
    
  </div>
`
