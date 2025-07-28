import React, {useState, useEffect} from "react";
import "./App.css";

import Navbar from "./components/navbar/Navbar";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Footer from "./components/footer/Footer";
import Home from "./pages/home/Home";
import Courses from "./pages/courses/Courses";
import About from "./pages/about/About";
import Testimonials from "./pages/testimonials/Testimonials";
import ScrollToTop from "./components/ScrollToTop";
import Error from "./pages/Error";
import Register from "./pages/register/Register";

const App = () => {


  return (
    <div className="bg-primary text-primaryWhite font-karla relative">
      <ScrollToTop />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/about" element={<About />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Error />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
};

export default App;
