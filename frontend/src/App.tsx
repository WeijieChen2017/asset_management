import { HashRouter, Routes, Route } from 'react-router-dom';
import { PortfolioProvider } from './store/portfolio';
import { ThemeProvider } from './store/theme';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import Home from './routes/Home';
import Allocation from './routes/Allocation';
import Trading from './routes/Trading';
import Reporting from './routes/Reporting';

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <PortfolioProvider>
          <ToastProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<Home />} />
                <Route path="/allocation" element={<Allocation />} />
                <Route path="/trading" element={<Trading />} />
                <Route path="/reporting" element={<Reporting />} />
              </Route>
            </Routes>
          </ToastProvider>
        </PortfolioProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
