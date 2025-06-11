
import React, { useState, createContext, useContext, useCallback, useMemo, useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppContextType, User, Worker, Event, Uniform, UserAccessLevel, WorkerPosition, WorkerStatus, EventType, AppSettings, ToastMessage, ToastType } from './types';
import LoginPage from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkersPage from './pages/WorkersPage';
import EventsPage from './pages/EventsPage';
import UniformsPage from './pages/UniformsPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import AdminSettingsPage from './pages/AdminSettingsPage'; // New Page
import PublicEventsPage from './pages/PublicEventsPage'; // New Page
import TopBar from './components/common/TopBar'; // New Component
import ToastContainer from './components/common/ToastContainer'; // New Component

// Mock Data (will be used as initial data if localStorage is empty)
const MOCK_WORKERS: Worker[] = [
  { id: 'w1', name: 'Pastor João Silva (Admin)', position: WorkerPosition.PastorPresidente, phone: '5511999990001', address: 'Rua Principal, 123', dob: '1970-05-15', status: WorkerStatus.Active, photoUrl: 'https://picsum.photos/seed/pastorjoao/100/100' },
  { id: 'w2', name: 'Diácono Carlos Lima (Obreiro)', position: WorkerPosition.Diacono, phone: '5511999990002', address: 'Av. Secundária, 456', dob: '1985-11-20', status: WorkerStatus.Active, photoUrl: 'https://picsum.photos/seed/diaconocarlos/100/100' },
  { id: 'w3', name: 'Missionária Ana Costa (Obreira)', position: WorkerPosition.Missionario, phone: '5511999990003', address: 'Travessa Flores, 789', dob: '1990-02-10', status: WorkerStatus.Active, photoUrl: 'https://picsum.photos/seed/missionariaana/100/100' },
  { id: 'w4', name: 'Obreira Maria Souza', position: WorkerPosition.Obreiro, phone: '5511999990004', address: 'Alameda Bosque, 101', dob: '1995-07-25', status: WorkerStatus.Inactive, photoUrl: 'https://picsum.photos/seed/obreiramaria/100/100' },
];

const MOCK_UNIFORMS: Uniform[] = [
  { id: 'u1', name: 'Social Completo', description: 'Terno e gravata para homens, vestido ou saia social para mulheres.' },
  { id: 'u2', name: 'Camisa Azul Oficial', description: 'Camisa azul da igreja com calça/saia preta.' },
];

const getNextSunday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1, ...
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - dayOfWeek) % 7); // If today is Sunday, it gives today
  if (dayOfWeek === 0 && today.getHours() >= 19) { // If it's Sunday and past service time, get next Sunday
     nextSunday.setDate(today.getDate() + 7);
  }
  return nextSunday.toISOString().slice(0,10);
};

const MOCK_EVENTS: Event[] = [
  { id: 'e1', type: EventType.Culto, customName: 'Culto de Domingo', dateTime: `${getNextSunday()}T19:00:00.000Z`, location: 'Templo Principal', notes: 'Santa Ceia neste culto.', schedule: { responsibleDoor: 'w2', deaconsOnDuty: ['w2'], responsiblePrayer: 'w3', responsibleClose: 'w1' }, uniformId: 'u1' },
  { id: 'e2', type: EventType.Vigilia, dateTime: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().slice(0,10) + 'T22:00:00.000Z', location: 'Salão Anexo', schedule: { responsiblePrayer: 'w3' }, uniformId: 'u2' },
];

const DEFAULT_APP_SETTINGS: AppSettings = {
  churchLogoUrl: '', // Default to no logo
  publicEventsEnabled: false,
  publicEventsKey: `key${Date.now().toString().slice(-6)}`, // Simple unique key
};

const LOCAL_STORAGE_KEYS = {
  USER: 'obreiroFielUser_v1',
  WORKERS: 'obreiroFielWorkers_v1',
  EVENTS: 'obreiroFielEvents_v1',
  UNIFORMS: 'obreiroFielUniforms_v1',
  SETTINGS: 'obreiroFielAppSettings_v1',
};

export const AppContext = createContext<AppContextType | null>(null);

// Debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };
};

const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserInternal] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [workers, setWorkersInternal] = useState<Worker[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.WORKERS);
    return stored ? JSON.parse(stored) : MOCK_WORKERS;
  });
  const [events, setEventsInternal] = useState<Event[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.EVENTS);
    return stored ? JSON.parse(stored) : MOCK_EVENTS;
  });
  const [uniforms, setUniformsInternal] = useState<Uniform[]>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.UNIFORMS);
    return stored ? JSON.parse(stored) : MOCK_UNIFORMS;
  });
  const [appSettings, setAppSettingsInternal] = useState<AppSettings>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : DEFAULT_APP_SETTINGS;
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 3000);
  };

  // Persist to localStorage
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.WORKERS, JSON.stringify(workers)); }, [workers]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.EVENTS, JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.UNIFORMS, JSON.stringify(uniforms)); }, [uniforms]);
  useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings)); }, [appSettings]);

  const setCurrentUser = (user: User | null) => setCurrentUserInternal(user);

  // Debounced save for context updates
  const createDebouncedSetter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, itemName: string) => {
    return debounce((newData: T | ((prevData: T) => T)) => {
      setter(newData);
      showToast(`${itemName} salvo(s) com sucesso!`, 'success');
    }, 1000); // 1 second debounce
  };
  
  const setWorkers = createDebouncedSetter(setWorkersInternal, 'Obreiros');
  const setEvents = createDebouncedSetter(setEventsInternal, 'Eventos');
  const setUniforms = createDebouncedSetter(setUniformsInternal, 'Uniformes');

  const addWorker = useCallback((workerData: Omit<Worker, 'id'>) => {
    setWorkersInternal(prev => [...prev, { ...workerData, id: `w${Date.now()}` }]);
    showToast('Obreiro adicionado com sucesso!', 'success');
  }, []);
  const updateWorker = useCallback((updatedWorker: Worker) => {
    setWorkersInternal(prev => prev.map(w => w.id === updatedWorker.id ? updatedWorker : w));
    // showToast('Dados do obreiro atualizados!', 'success'); // Debounced version will show
  }, []);
  const deleteWorker = useCallback((workerId: string) => {
    setWorkersInternal(prev => prev.filter(w => w.id !== workerId));
    showToast('Obreiro excluído.', 'success');
  }, []);

  const addEvent = useCallback((eventData: Omit<Event, 'id'>) => {
    setEventsInternal(prev => [...prev, { ...eventData, id: `e${Date.now()}` }]);
    showToast('Evento adicionado com sucesso!', 'success');
  }, []);
  const updateEvent = useCallback((updatedEvent: Event) => {
    setEventsInternal(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    // showToast('Evento atualizado!', 'success');
  }, []);
  const deleteEvent = useCallback((eventId: string) => {
    setEventsInternal(prev => prev.filter(e => e.id !== eventId));
    showToast('Evento excluído.', 'success');
  }, []);

  const addUniform = useCallback((uniformData: Omit<Uniform, 'id'>) => {
    setUniformsInternal(prev => [...prev, { ...uniformData, id: `u${Date.now()}` }]);
    showToast('Uniforme adicionado com sucesso!', 'success');
  }, []);
  const updateUniform = useCallback((updatedUniform: Uniform) => {
    setUniformsInternal(prev => prev.map(u => u.id === updatedUniform.id ? updatedUniform : u));
    // showToast('Uniforme atualizado!', 'success');
  }, []);
  const deleteUniform = useCallback((uniformId: string) => {
    setUniformsInternal(prev => prev.filter(u => u.id !== uniformId));
    showToast('Uniforme excluído.', 'success');
  }, []);

  const updateAppSettings = useCallback((settingsUpdate: Partial<AppSettings>) => {
    setAppSettingsInternal(prev => ({ ...prev, ...settingsUpdate }));
    showToast('Configurações salvas!', 'success');
  }, []);

  const contextValue = useMemo(() => ({
    currentUser, setCurrentUser,
    workers, setWorkers: setWorkersInternal, addWorker, updateWorker, deleteWorker, // Use internal for direct, debounced for forms
    events, setEvents: setEventsInternal, addEvent, updateEvent, deleteEvent,
    uniforms, setUniforms: setUniformsInternal, addUniform, updateUniform, deleteUniform,
    appSettings, updateAppSettings,
    showToast,
  }), [currentUser, workers, events, uniforms, appSettings, addWorker, updateWorker, deleteWorker, addEvent, updateEvent, deleteEvent, addUniform, updateUniform, deleteUniform, updateAppSettings]);
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </AppContext.Provider>
  );
};

interface ProtectedRouteProps {
  allowedRoles?: UserAccessLevel[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const context = useContext(AppContext);
  const location = useLocation();

  if (!context?.currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(context.currentUser.accessLevel)) {
    // Redirect to dashboard if role not allowed, or to a specific "access denied" page
    return <Navigate to="/dashboard" replace />; 
  }
  return children ? <>{children}</> : <Outlet />;
};

// New Main Application Layout with TopBar
const AppLayout: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) return null; // Should not happen if wrapped in provider

  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-100">
        <Outlet />
      </main>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AppContextProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/public-events" element={<PublicEventsPage />} /> {/* New public route */}
          
          <Route element={<ProtectedRoute />}> {/* Routes below this require authentication */}
            <Route element={<AppLayout />}> {/* Layout for authenticated routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route 
                path="/workers" 
                element={
                  <ProtectedRoute allowedRoles={[UserAccessLevel.Admin]}>
                    <WorkersPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/events" 
                element={
                   <ProtectedRoute allowedRoles={[UserAccessLevel.Admin, UserAccessLevel.Obreiro]}>
                    <EventsPage />
                   </ProtectedRoute>
                } 
              />
              <Route 
                path="/uniforms" 
                element={
                  <ProtectedRoute allowedRoles={[UserAccessLevel.Admin]}>
                    <UniformsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/account-settings" 
                element={
                  <ProtectedRoute allowedRoles={[UserAccessLevel.Admin, UserAccessLevel.Obreiro]}>
                    <AccountSettingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-settings" 
                element={
                  <ProtectedRoute allowedRoles={[UserAccessLevel.Admin]}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
           <Route path="*" element={<Navigate to="/dashboard" replace />} /> {/* Fallback redirect */}
        </Routes>
      </HashRouter>
    </AppContextProvider>
  );
};

export default App;