import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/index';
import { Toaster } from 'sonner';
import InstallPWA from './components/InstallPWA';

function App() {
  return (
    <Router>
      <AppRoutes />
      <Toaster position="top-center" />
      <InstallPWA />
    </Router>
  );
}

export default App;
