import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import AppErrorBoundary from './components/AppErrorBoundary';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
