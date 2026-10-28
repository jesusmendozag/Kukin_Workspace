import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AddIngredient from './pages/AddIngredient';
import Recipes from './pages/Recipes';
import Diets from './pages/Diets';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        
        {/* Rutas Protegidas y Responsivas */}
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/add" element={<Layout><AddIngredient /></Layout>} />
        <Route path="/recipes" element={<Layout><Recipes /></Layout>} />
        <Route path="/diets" element={<Layout><Diets /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;