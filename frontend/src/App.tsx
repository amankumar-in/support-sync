import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import Dashboard from "./pages/Dashboard";
import CaseworkerDashboard from "./pages/CaseworkerDashboard";
import Users from "./pages/admin/settings/Users";
import Organization from "./pages/admin/settings/Organization";
import AITraining from "./pages/admin/settings/AITraining";
import Sessions from "./pages/Sessions";
import AdminLayout from "./pages/admin/AdminLayout";
import SessionDetailPage from "./pages/SessionDetailPage";
import Clients from "./pages/clients/Clients";
import CreateClient from "./pages/clients/CreateClient";
import Chatbot from "./pages/chatbot/Chatbot";
import ClientDetail from "./pages/clients/ClientDetail";

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication routes (no layout) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin layout routes */}
        <Route element={<AdminLayout />}>
          {/* Dashboard */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Clients */}
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/create" element={<CreateClient />} />
          <Route path="/clients/:id" element={<ClientDetail />} />

          {/* AI Chat */}
          <Route path="/ai-chat" element={<Chatbot />} />

          {/* Caseworker Dashboard */}
          <Route
            path="/caseworker-dashboard"
            element={<CaseworkerDashboard />}
          />

          {/* Sessions */}
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />

          {/* Settings */}
          <Route path="/settings/users" element={<Users />} />
          <Route path="/settings/organization" element={<Organization />} />
          <Route path="/settings/ai-training" element={<AITraining />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
