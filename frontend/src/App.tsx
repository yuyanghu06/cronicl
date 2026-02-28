import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import NavBar from './components/NavBar'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import ExplorerPage from './pages/ExplorerPage'
import TimelinePage from './pages/TimelinePage'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/explore" element={<ExplorerPage />} />
          <Route path="/timeline/:id" element={<TimelinePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
