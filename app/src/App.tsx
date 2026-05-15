import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Home from './pages/Home';
import Movie from './pages/Movie';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (

    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/movie/:id' element={<Movie />} />
        <Route path="*" element={<NotFound />} />

      </Routes>

    </Router>

  );
}

export default App;
