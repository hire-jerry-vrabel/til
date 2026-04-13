import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Header } from "./components/Header"
import { Home } from "./pages/Home"
import { Post } from "./pages/Post"
import { Bash } from "./pages/Bash"
import { ThemeProvider } from "./context/ThemeContext"
import { ScrollToTop } from "./components/ScrollToTop"
import "./styles/variables.css"
import "./index.css"

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename="/til">
        <div className="app">
          <ScrollToTop />
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/post/:slug" element={<Post />} />
            <Route path="/bash" element={<Bash />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
