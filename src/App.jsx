import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Inicio from './views/Inicio';
import AsientoAperturaPage from './views/AsientoApertura';
import MovimientosPage from './views/Movimientos';
import BalanceGeneralPage from './views/BalanceGeneral';
import LibroDiarioPage from './views/LibroDiario';
import LibroMayorPage from './views/LibroMayor';
import BalanceComprobacionPage from './views/BalanceComprobacion';

function App() {
  return (
      <Router>
          <div className="d-flex" style={{ minHeight: '100vh' }}>
              <Sidebar />
              <div className="flex-grow-1 p-4">
                  <Routes>
                      <Route path="/" element={<Inicio />} />
                      <Route path="/asiento-apertura" element={<AsientoAperturaPage />} />
                      <Route path="/movimientos" element={<MovimientosPage />} />
                      <Route path="/balance" element={<BalanceGeneralPage />} />
                      <Route path="/libro-diario" element={<LibroDiarioPage />} />
                      <Route path="/libro-mayor" element={<LibroMayorPage />} />
                      <Route path="/balance-comprobacion" element={<BalanceComprobacionPage />} />
                  </Routes>
              </div>
          </div>
      </Router>
  );
}

export default App;