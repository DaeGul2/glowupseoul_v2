// Admin shell — routing + auth gate + chrome.
// Uses react-router-dom's location (path-based). The admin sub-app gets its
// own Routes definition under `/admin/*`.
import { useEffect } from 'react';
import { Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import { isAdminAuthed } from './api.js';
import { useSeo } from '../utils/seo.js';
import AdminLogin from './AdminLogin.jsx';
import AdminLayout from './AdminLayout.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import AdminList from './AdminList.jsx';
import AdminEdit from './AdminEdit.jsx';
import AdminPartners from './AdminPartners.jsx';
import ConcernMatrixPage from './ConcernMatrixPage.jsx';
import ProcedureDeviceMatrixPage from './ProcedureDeviceMatrixPage.jsx';

// 매트릭스성 모델은 특수 그룹뷰. AdminList 우회.
function ListRoute()  {
  const { kind } = useParams();
  if (kind === 'concern_procedures')  return <ConcernMatrixPage />;
  if (kind === 'procedure_devices')   return <ProcedureDeviceMatrixPage />;
  return <AdminList kind={kind} key={kind} />;
}
function EditRoute()  { const { kind, id } = useParams(); return <AdminEdit kind={kind} id={id} key={`${kind}/${id}`} />; }
function NewRoute()   { const { kind } = useParams(); return <AdminEdit kind={kind} id={null} key={`${kind}/new`} />; }

export default function AdminApp() {
  const location = useLocation();
  useSeo({ title: 'Admin', noindex: true });

  if (!isAdminAuthed()) {
    // Don't redirect-loop on /admin/login.
    if (location.pathname !== '/admin/login') {
      return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }
    return <AdminLogin />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/admin"                element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login"          element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard"      element={<AdminDashboard />} />
        <Route path="/admin/partners"       element={<AdminPartners />} />
        <Route path="/admin/:kind/new"      element={<NewRoute />} />
        <Route path="/admin/:kind/:id"      element={<EditRoute />} />
        <Route path="/admin/:kind"          element={<ListRoute />} />
      </Routes>
    </AdminLayout>
  );
}
