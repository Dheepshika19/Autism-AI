import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.css'
import TimetablePlanner from './pages/TimetablePlanner'
import StaffAllocator from './pages/StaffAllocator'
import ProgressDashboard from './pages/ProgressDashboard'

// Register a simple service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <div>Home (coming soon)</div> },
      { path: '/children', element: <div>Children Manager (coming soon)</div> },
      { path: '/timetable', element: <TimetablePlanner /> },
      { path: '/staff', element: <StaffAllocator /> },
      { path: '/progress', element: <ProgressDashboard /> },
      { path: '/settings', element: <div>Settings (coming soon)</div> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
