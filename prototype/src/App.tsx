import React, { useEffect } from 'react';
import { AppRouter } from './routes/AppRouter';
import { useDemoStore } from './store/useDemoStore';

export const App: React.FC = () => {
  const { initDemoData } = useDemoStore();

  useEffect(() => {
    initDemoData();
  }, [initDemoData]);

  return <AppRouter />;
};

export default App;
