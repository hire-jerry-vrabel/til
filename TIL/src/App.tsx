import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Header } from "./components/Header"
import { Home } from "./pages/Home"
import { Post } from "./pages/Post"
import { ThemeProvider } from "./context/ThemeContext"
import "./styles/variables.css"
import "./index.css"

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/til">
        <div className="app">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:slug" element={<Post />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
