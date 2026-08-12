import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ChatBot from './components/ChatBot/ChatBot.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Benteveo - Home</h1>} />
      </Routes>
      <ChatBot />
    </BrowserRouter>
  )
}

export default App
