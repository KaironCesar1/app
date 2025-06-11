
import React, { useState, useContext, useMemo, useRef, useEffect, useCallback } from 'react';
import { AppContext } from '../App';
import { Worker, WorkerPosition, WorkerStatus, UserAccessLevel, AppContextType } from '../types';
import { Modal } from '../components/common/Modal';
import { EditIcon, CameraIcon, PhotoIcon, WhatsAppIcon } from '../components/common/IconCatalog';

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

const ProfileEditForm: React.FC<{ worker: Worker; onClose: () => void; context: AppContextType }> = ({ worker, onClose, context }) => {
  const [formData, setFormData] = useState<Omit<Worker, 'id' | 'status'>>({ 
    name: worker.name,
    position: worker.position,
    phone: worker.phone,
    address: worker.address,
    dob: worker.dob,
    photoUrl: worker.photoUrl || '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(worker.photoUrl);
  const fileInputRefCamera = useRef<HTMLInputElement>(null);
  const fileInputRefGallery = useRef<HTMLInputElement>(null);

  const { updateWorker: contextUpdateWorker, showToast } = context;

  const debouncedSave = useCallback(
    debounce(async (currentData: Omit<Worker, 'id' | 'status'>) => {
      contextUpdateWorker({ ...worker, ...currentData }); // Merge with original worker to keep ID and status
    }, 1500),
    [worker, contextUpdateWorker, showToast]
  );

  useEffect(() => {
    debouncedSave(formData);
  }, [formData, debouncedSave]);


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
    contextUpdateWorker({ ...worker, ...formData }); // Final save
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
          <input type="file" accept="image/*" capture="user" onChange={handlePhotoUpload} ref={fileInputRefCamera} className="hidden" id={`profileTakePhoto-${worker.id}`}/>
          <button type="button" onClick={() => fileInputRefCamera.current?.click()} className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-1">
            <CameraIcon className="w-4 h-4" /> <span>Tirar Foto</span>
          </button>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} ref={fileInputRefGallery} className="hidden" id={`profileChooseGallery-${worker.id}`}/>
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
        <label htmlFor={`profileName-${worker.id}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome Completo</label>
        <input type="text" name="name" id={`profileName-${worker.id}`} value={formData.name} onChange={handleChange} required className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor={`profilePosition-${worker.id}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Cargo</label>
        <select name="position" id={`profilePosition-${worker.id}`} value={formData.position} onChange={handleChange} disabled={context.currentUser?.accessLevel !== UserAccessLevel.Admin} className={`${commonInputStyles} ${context.currentUser?.accessLevel !== UserAccessLevel.Admin ? 'bg-gray-100 dark:bg-slate-600 opacity-70' : ''}`}>
          {Object.values(WorkerPosition).map(pos => <option key={pos} value={pos}>{pos}</option>)}
        </select>
         {context.currentUser?.accessLevel !== UserAccessLevel.Admin && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Cargo só pode ser alterado por um Administrador.</p>}
      </div>
      <div>
        <label htmlFor={`profilePhone-${worker.id}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Telefone/WhatsApp</label>
        <input type="tel" name="phone" id={`profilePhone-${worker.id}`} value={formData.phone} onChange={handleChange} placeholder="Ex: 5511987654321" className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor={`profileAddress-${worker.id}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Endereço</label>
        <input type="text" name="address" id={`profileAddress-${worker.id}`} value={formData.address} onChange={handleChange} className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor={`profileDob-${worker.id}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300">Data de Nascimento</label>
        <input type="date" name="dob" id={`profileDob-${worker.id}`} value={formData.dob} onChange={handleChange} className={commonInputStyles} />
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 py-3 -mx-1 px-1 border-t dark:border-slate-700">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md border border-gray-300 dark:border-slate-600">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">Concluído</button>
      </div>
    </form>
  );
};

const AccountSettingsPage: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const currentUser = context?.currentUser;
  const workerProfile = useMemo(() => {
    if (currentUser?.workerId && context?.workers) {
      return context.workers.find(w => w.id === currentUser.workerId);
    }
    return undefined;
  }, [currentUser, context?.workers]);

  if (!currentUser || !context) {
    return <p className="text-center text-gray-500 dark:text-slate-400">Carregando...</p>;
  }

  const formatWhatsAppLink = (phone: string) => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}`;
  };

  return (
    <div className="space-y-6">
      <header className="pb-4 border-b border-gray-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Minha Conta</h1>
      </header>

      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Informações de Login</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-slate-400">Nome de Usuário (Login):</p>
            <p className="font-medium text-gray-800 dark:text-slate-100">{currentUser.username}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-slate-400">Nível de Acesso:</p>
            <p className="font-medium text-gray-800 dark:text-slate-100">{currentUser.accessLevel}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">Para alterar sua senha, entre em contato com um administrador.</p>
      </section>

      {workerProfile && (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200">Meu Perfil de Obreiro</h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-sky-500 text-white text-sm rounded-md shadow hover:bg-sky-600 transition-colors"
              aria-label="Editar Perfil de Obreiro"
            >
              <EditIcon className="w-4 h-4" />
              <span>Editar Perfil</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1 flex flex-col items-center">
              <img
                src={workerProfile.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(workerProfile.name)}&background=random&color=fff&size=128`}
                alt={workerProfile.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-sky-200 dark:border-sky-700 shadow-md mb-3"
              />
              <h3 className="text-2xl font-bold text-center text-sky-700 dark:text-sky-400">{workerProfile.name}</h3>
              <p className="text-gray-600 dark:text-slate-300 text-center">{workerProfile.position}</p>
              <span className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${workerProfile.status === WorkerStatus.Active ? 'bg-green-100 dark:bg-green-700/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-700/30 text-red-700 dark:text-red-300'}`}>
                {workerProfile.status}
              </span>
            </div>

            <div className="md:col-span-2 space-y-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-slate-400">Telefone / WhatsApp:</p>
                <div className="flex items-center">
                    <p className="font-medium text-gray-800 dark:text-slate-100">{workerProfile.phone || 'Não informado'}</p>
                    {workerProfile.phone && (
                        <a href={formatWhatsAppLink(workerProfile.phone)} target="_blank" rel="noopener noreferrer" className="ml-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300" title="Abrir no WhatsApp">
                        <WhatsAppIcon className="w-5 h-5" />
                        </a>
                    )}
                </div>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400">Endereço:</p>
                <p className="font-medium text-gray-800 dark:text-slate-100">{workerProfile.address || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400">Data de Nascimento:</p>
                <p className="font-medium text-gray-800 dark:text-slate-100">{workerProfile.dob ? new Date(workerProfile.dob).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'Não informada'}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {workerProfile && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Meu Perfil de Obreiro" size="lg">
          <ProfileEditForm worker={workerProfile} onClose={() => setIsEditModalOpen(false)} context={context} />
        </Modal>
      )}
    </div>
  );
};

export default AccountSettingsPage;