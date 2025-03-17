import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Menu } from './pages/Menu';
import { Calendar } from './pages/Calendar';
import { Recipes } from './pages/Recipes';
import { Inventory } from './pages/Inventory';
import { ShoppingList } from './pages/ShoppingList';
import { Diary } from './pages/Diary';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="pb-24"> {/* Add padding to account for fixed navigation */}
          <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/shopping" element={<ShoppingList />} />
            <Route path="/diary" element={<Diary />} />
          </Routes>
        </div>
        <Navigation />
      </div>
    </Router>
  );
}

export default App;