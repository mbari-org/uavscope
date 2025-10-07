import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/dataService';
import Layout from './components/Layout/Layout';
import './index.css';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen w-screen overflow-hidden">
        <Layout />
      </div>
    </QueryClientProvider>
  );
}

export default App;
