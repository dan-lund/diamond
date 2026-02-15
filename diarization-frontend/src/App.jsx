import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Diarization from './Diarization';
import Speakers from './Speakers';

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-emerald-900 selection:text-emerald-50 overflow-hidden">
        
        {/* Fixed Sidebar */}
        <Sidebar />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto relative">
          <Routes>
            <Route path="/" element={<Diarization />} />
            <Route path="/speakers" element={<Speakers />} />
          </Routes>
        </main>
        
      </div>
    </Router>
  );
}