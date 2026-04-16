import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Charts from './pages/Charts';
import Capacity from './pages/Capacity';
import Workload from './pages/Workload';
import ManualEntry from './pages/ManualEntry';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/charts" element={<Charts />} />
        <Route path="/capacity" element={<Capacity />} />
        <Route path="/workload" element={<Workload />} />
        <Route path="/entry" element={<ManualEntry />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
