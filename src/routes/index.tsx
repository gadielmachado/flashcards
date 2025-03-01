import { Routes, Route } from 'react-router-dom';
import Index from '../pages/Index';
import Create from '../pages/Create';
import Study from '../pages/Study';

// Exportação direta do componente
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/create" element={<Create />} />
      <Route path="/study/:deckId" element={<Study />} />
      <Route path="*" element={<div className="flex min-h-screen items-center justify-center text-lg">Página não encontrada</div>} />
    </Routes>
  );
}