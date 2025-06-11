
import React, { useState, useContext, useMemo, useRef, useEffect, useCallback } from 'react';
import { AppContext } from '../App';
import { Worker, WorkerPosition, WorkerStatus, UserAccessLevel, AppContextType } from '../types';
import { Modal } from '../components/common/Modal';
import { PlusIcon, EditIcon, TrashIcon, FilterIcon, WhatsAppIcon, CameraIcon, PhotoIcon } from '../components/common/IconCatalog';

// Debounce utility (could be moved to a shared utils file)
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };
  return debounced;
};


const WorkerForm: React.FC<{ worker?: Worker; onClose: () => void; context: AppContextType }> = ({ worker, onClose, context }) => {
  const [formData, setFormData] = useState<Omit<Worker, 'id'>>({
    name: worker?.name || '',
    position: worker?.position || WorkerPosition.Obreiro,
    phone: worker?.phone || '',
    address: worker?.address || '',
    dob: worker?.dob || '',
    photoUrl: worker?.photoUrl || '',
    status: worker?.status || WorkerStatus.Active,
  });
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(worker?.photoUrl);
  const fileInputRefCamera = useRef<HTMLInputElement>(null);
  const fileInputRefGallery = useRef<HTMLInputElement>(null);

  const { updateWorker: contextUpdateWorker, addWorker: contextAddWorker, showToast } = context;

  const debouncedSave = useCallback(
    debounce(async (currentData: Omit<Worker, 'id'>) => {
      if (worker) { // Editing existing worker
        contextUpdateWorker({ ...currentData, id: worker.id });
         // Toast is shown by AppContext on successful save via context methods now
      }
      // For new workers, saving happens on explicit submit via "Adicionar Obreiro"
    }, 1500),
    [worker, contextUpdateWorker, showToast] 
  );
  
  useEffect(() => {
    if (worker) { // Only auto-save if editing an existing worker
      debouncedSave(formData);
    }
  }, [formData, worker, debouncedSave]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, photoUrl: base64String }));
        setPhotoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
    if(event.target) event.target.value = ''; 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (worker) { // Editing
      contextUpdateWorker({ ...formData, id: worker.id }); // Ensure final save
    } else { // Adding new
      contextAddWorker(formData);
    }
    onClose();
  };
  
  const commonInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";


  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-1 pr-2 custom-scrollbar">
      <div className="text-center mb-4">
        {photoPreview ? (
          <img src={photoPreview} alt="Pré-visualização" className="w-32 h-32 rounded-full object-cover mx-auto mb-2 border-2 border-sky-300 dark:border-sky-600" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mx-auto mb-2 text-sm">Sem foto</div>
        )}
        <div className="flex justify-center space-x-2">
          <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} ref={fileInputRefCamera} className="hidden" id={`takePhoto-${worker?.id || 'new'}`}/>
          <button type="button" onClick={() => fileInputRefCamera.current?.click()} className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-1">
            <CameraIcon className="w-4 h-4" /> <span>Tirar Foto</span>
          </button>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} ref={fileInputRefGallery} className="hidden" id={`chooseGallery-${worker?.id || 'new'}`}/>
          <button type="button" onClick={() => fileInputRefGallery.current?.click()} className="text-xs px-3 py-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center space-x-1">
            <PhotoIcon className="w-4 h-4" /> <span>Galeria</span>
          </button>
        </div>
        {formData.photoUrl && (
             <button 
                type="button" 
                onClick={() => { setFormData(prev => ({ ...prev, photoUrl: '' })); setPhotoPreview(undefined); }}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
            >
                Remover Foto
            </button>
        )}
      </div>

      <div>
        <label htmlFor={`name-${worker?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome Completo</label>
        <input type="text" name="name" id={`name-${worker?.id || 'new'}`} value={formData.name} onChange={handleChange} required className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor={`position-${worker?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Cargo</label>
        <select name="position" id={`position-${worker?.id || 'new'}`} value={formData.position} onChange={handleChange} className={commonInputStyles}>
          {Object.values(WorkerPosition).map(pos => <option key={pos} value={pos}>{pos}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor={`phone-${worker?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Telefone/WhatsApp</label>
        <input type="tel" name="phone" id={`phone-${worker?.id || 'new'}`} value={formData.phone} onChange={handleChange} placeholder="Ex: 5511987654321" className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor={`address-${worker?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Endereço</label>
        <input type="text" name="address" id={`address-${worker?.id || 'new'}`} value={formData.address} onChange={handleChange} className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor={`dob-${worker?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Data de Nascimento</label>
        <input type="date" name="dob" id={`dob-${worker?.id || 'new'}`} value={formData.dob} onChange={handleChange} className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor={`status-${worker?.id || 'new'}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Status</label>
        <select name="status" id={`status-${worker?.id || 'new'}`} value={formData.status} onChange={handleChange} className={commonInputStyles}>
          {Object.values(WorkerStatus).map(stat => <option key={stat} value={stat}>{stat}</option>)}
        </select>
      </div>
      <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 py-3 -mx-1 px-1 border-t dark:border-slate-700">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md border border-gray-300 dark:border-slate-600">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">{worker ? 'Concluído' : 'Adicionar Obreiro'}</button>
      </div>
    </form>
  );
};


const WorkersPage: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkerStatus | 'Todos'>('Todos');
  const [positionFilter, setPositionFilter] = useState<WorkerPosition | 'Todos'>('Todos');

  const isAdmin = context?.currentUser?.accessLevel === UserAccessLevel.Admin;

  const handleAddWorker = () => {
    setEditingWorker(undefined);
    setIsModalOpen(true);
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setIsModalOpen(true);
  };

  const handleDeleteWorker = (workerId: string) => {
    const isScheduled = context?.events.some(event => 
        event.schedule.responsibleDoor === workerId ||
        event.schedule.responsibleClose === workerId ||
        event.schedule.responsiblePrayer === workerId ||
        event.schedule.deaconsOnDuty?.includes(workerId)
    );
    if (isScheduled) {
        alert("Este obreiro está escalado em um ou mais eventos e não pode ser excluído. Remova-o das escalas primeiro.");
        return;
    }

    if (window.confirm('Tem certeza que deseja excluir este obreiro? Esta ação não pode ser desfeita.')) {
      context?.deleteWorker(workerId);
    }
  };

  const filteredWorkers = useMemo(() => {
    return context?.workers
      .filter(worker => 
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.position.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(worker => statusFilter === 'Todos' || worker.status === statusFilter)
      .filter(worker => positionFilter === 'Todos' || worker.position === positionFilter)
      .sort((a,b) => a.name.localeCompare(b.name)) || [];
  }, [context?.workers, searchTerm, statusFilter, positionFilter]);

  if (!context) return <p className="text-gray-700 dark:text-slate-300">Carregando...</p>;

  const formatWhatsAppLink = (phone: string) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}`;
  };
  
  const commonInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-4 sm:mb-0">Gerenciamento de Obreiros</h1>
        {isAdmin && (
          <button
            onClick={handleAddWorker}
            aria-label="Adicionar Novo Obreiro"
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Adicionar Obreiro</span>
          </button>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Buscar Obreiro</label>
          <input
            type="text"
            id="searchTerm"
            placeholder="Nome ou Cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={commonInputStyles}
          />
        </div>
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Filtrar por Status</label>
          <select 
            id="statusFilter" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as WorkerStatus | 'Todos')}
            className={commonInputStyles}
          >
            <option value="Todos">Todos</option>
            {Object.values(WorkerStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="positionFilter" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Filtrar por Cargo</label>
          <select 
            id="positionFilter" 
            value={positionFilter} 
            onChange={(e) => setPositionFilter(e.target.value as WorkerPosition | 'Todos')}
            className={commonInputStyles}
          >
            <option value="Todos">Todos</option>
            {Object.values(WorkerPosition).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
         <div className="flex items-center text-gray-600 dark:text-slate-400">
          <FilterIcon className="w-5 h-5 mr-2"/> 
          {filteredWorkers.length} obreiro(s) encontrado(s)
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredWorkers.map(worker => (
          <div key={worker.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src={worker.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name)}&background=random&color=fff&size=80`} 
                  alt={worker.name} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-sky-500 dark:border-sky-600"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100">{worker.name}</h2>
                  <p className="text-sky-600 dark:text-sky-400">{worker.position}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-slate-300 space-y-1 mb-4">
                <div className="flex items-center">
                  <strong>Telefone:</strong> <span className="ml-1">{worker.phone || 'N/A'}</span> 
                  {worker.phone && (
                     <a href={formatWhatsAppLink(worker.phone)} target="_blank" rel="noopener noreferrer" className="ml-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300" title="Abrir no WhatsApp">
                       <WhatsAppIcon className="w-5 h-5" />
                     </a>
                  )}
                </div>
                <p><strong>Endereço:</strong> {worker.address || 'N/A'}</p>
                <p><strong>Nascimento:</strong> {worker.dob ? new Date(worker.dob).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A'}</p> {/* Added timeZone UTC */}
                <p><strong>Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${worker.status === WorkerStatus.Active ? 'bg-green-100 dark:bg-green-700/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-700/30 text-red-700 dark:text-red-300'}`}>{worker.status}</span></p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex justify-end space-x-3 mt-auto pt-4 border-t border-gray-200 dark:border-slate-700">
                <button onClick={() => handleEditWorker(worker)} className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-700/30 rounded-full transition-colors" aria-label={`Editar ${worker.name}`}><EditIcon className="w-5 h-5" /></button>
                <button onClick={() => handleDeleteWorker(worker.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-700/30 rounded-full transition-colors" aria-label={`Excluir ${worker.name}`}><TrashIcon className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
      {filteredWorkers.length === 0 && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Nenhum obreiro encontrado com os filtros atuais.</p>}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingWorker ? 'Editar Obreiro' : 'Adicionar Novo Obreiro'} size="lg">
        <WorkerForm worker={editingWorker} onClose={() => setIsModalOpen(false)} context={context} />
      </Modal>
    </div>
  );
};

export default WorkersPage;