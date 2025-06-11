
export enum UserAccessLevel {
  Admin = 'Administrador',
  Obreiro = 'Obreiro',
}

export enum WorkerPosition {
  AuxiliarDeObra = 'Auxiliar de Obra',
  Obreiro = 'Obreiro',
  Diacono = 'Diácono',
  Presbitero = 'Presbítero',
  Evangelista = 'Evangelista',
  Missionario = 'Missionário(a)',
  PastorAuxiliar = 'Pastor Auxiliar',
  Pastor = 'Pastor',
  PastorSetorial = 'Pastor Setorial',
  PastorRegional = 'Pastor Regional',
  PastorPresidente = 'Pastor Presidente',
  Bispo = 'Bispo',
  BispoPresidente = 'Bispo Presidente',
}

export enum WorkerStatus {
  Active = 'Ativo',
  Inactive = 'Inativo',
}

export interface Worker {
  id: string;
  name:string;
  position: WorkerPosition;
  phone: string;
  address: string;
  dob: string; // YYYY-MM-DD
  photoUrl?: string; // URL to placeholder or uploaded image (can be base64)
  status: WorkerStatus;
}

export enum EventType {
  Culto = 'Culto',
  Vigilia = 'Vigília',
  SantaCeia = 'Santa Ceia',
  Reuniao = 'Reunião',
  Outro = 'Outro',
}

export interface EventSchedule {
  responsibleDoor?: string; // Worker ID
  responsibleClose?: string; // Worker ID
  responsiblePrayer?: string; // Worker ID
  deaconsOnDuty?: string[]; // Array of Worker IDs
}

export interface Event {
  id: string;
  type: EventType;
  customName?: string; // If EventType.Outro
  dateTime: string; // ISO string
  location: string;
  notes?: string;
  schedule: EventSchedule;
  uniformId?: string; // Uniform ID
}

export interface Uniform {
  id: string;
  name: string; // e.g., Social, Azul, Preto, Branco
  description?: string;
}

export interface User {
  id: string; // Unique ID for the user session/login account
  username: string; // Login username
  accessLevel: UserAccessLevel;
  workerId?: string; // ID of the linked Worker record, if applicable
}

export interface AppSettings {
  churchLogoUrl?: string;
  publicEventsEnabled: boolean;
  publicEventsKey: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Context types
export interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  workers: Worker[];
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  updateWorker: (worker: Worker) => void;
  deleteWorker: (workerId: string) => void;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;
  uniforms: Uniform[];
  setUniforms: React.Dispatch<React.SetStateAction<Uniform[]>>;
  addUniform: (uniform: Omit<Uniform, 'id'>) => void;
  updateUniform: (uniform: Uniform) => void;
  deleteUniform: (uniformId: string) => void;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  showToast: (message: string, type?: ToastType) => void;
}