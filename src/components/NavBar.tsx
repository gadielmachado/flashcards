
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Plus, BarChart3 } from 'lucide-react';

const NavBar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="glass-morphism px-4 py-2 mx-4 mb-4 rounded-2xl flex justify-around items-center shadow-lg transition-all duration-300 ease-apple-ease animate-fade-in">
        <Link 
          to="/" 
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${
            isActive('/') 
              ? 'text-primary font-medium scale-110' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen size={24} />
          <span className="text-xs mt-1">Decks</span>
        </Link>
        
        <Link 
          to="/create" 
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${
            isActive('/create') 
              ? 'text-primary font-medium scale-110' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Plus size={24} />
          <span className="text-xs mt-1">Create</span>
        </Link>
        
        <Link 
          to="/stats" 
          className={`flex flex-col items-center p-2 rounded-xl transition-all ${
            isActive('/stats') 
              ? 'text-primary font-medium scale-110' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 size={24} />
          <span className="text-xs mt-1">Stats</span>
        </Link>
      </div>
    </div>
  );
};

export default NavBar;
