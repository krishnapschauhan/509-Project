import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import UserLogin from "./pages/login/user";
import AdminLogin from "./pages/login/admin";
import WorkerLogin from "./pages/login/worker"; 
import UserRegister from "./pages/register/user";
import Form from "./pages/Form";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import WorkerDashboard from "./pages/dashboard/WorkerDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login/user" element={<UserLogin />} /> 
          <Route path="/login/admin" element={<AdminLogin />} />  
          <Route path="/login/worker" element={<WorkerLogin />} /> 
          <Route path="/register/user" element={<UserRegister />} /> 
          <Route path="/form" element={<Form />} />
          <Route path="/admindashboard" element={<AdminDashboard />} />
          <Route path="/workerdashboard" element={<WorkerDashboard />} />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
