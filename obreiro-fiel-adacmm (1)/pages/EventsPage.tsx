
import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { AppContext } from '../App';
import { Event, EventType, EventSchedule, Worker, Uniform, UserAccessLevel, WorkerPosition, AppContextType } from '../types';
import { Modal } from '../components/common/Modal';
import { PlusIcon, EditIcon, TrashIcon, EyeIcon, FilterIcon } from '../components/common/IconCatalog';

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

interface EventFormProps {
  event?: Event;
  onClose: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onClose }) => {
  const context = useContext(AppContext) as AppContextType;
  const initialSchedule: EventSchedule = { responsibleDoor: '', responsibleClose: '', responsiblePrayer: '', deaconsOnDuty: [] };
  
  const [formData, setFormData] = useState<Omit<Event, 'id'>>({
    type: event?.type || EventType.Culto,
    customName: event?.customName || (event?.type !== EventType.Outro ? event?.type : ''),
    dateTime: event?.dateTime ? new Date(event.dateTime).toISOString().substring(0, 16) : '', 
    location: event?.location || '',
    notes: event?.notes || '',
    schedule: event?.schedule || initialSchedule,
    uniformId: event?.uniformId || '',
  });

  const { updateEvent: contextUpdateEvent, addEvent: contextAddEvent, showToast } = context;

  const debouncedSave = useCallback(
    debounce(async (currentData: Omit<Event, 'id'>) => {
      if (event) { // Editing existing event
        const eventDataToSave = {
          ...currentData,
          dateTime: new Date(currentData.dateTime).toISOString(),
          customName: currentData.type === EventType.Outro ? currentData.customName : currentData.type,
        };
        contextUpdateEvent({ ...eventDataToSave, id: event.id });
      }
    }, 1500),
    [event, contextUpdateEvent, showToast]
  );

  useEffect(() => {
    if (event) { // Only auto-save if editing an existing event
        // Ensure dateTime is valid before debouncing
        if (formData.dateTime) {
            debouncedSave(formData);
        }
    }
  }, [formData, event, debouncedSave]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      ...(name === 'type' && value !== EventType.Outro && { customName: value }),
      ...(name === 'type' && value === EventType.Outro && { customName: '' })
    }));
  };

  const handleScheduleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value, options } = e.target;
    if (name === 'deaconsOnDuty') {
      const selectedDeacons = Array.from(options).filter(option => option.selected).map(option => option.value);
      setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, [name]: selectedDeacons } }));
    } else {
      setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, [name]: value } }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dateTime) {
        showToast("Data e Hora são obrigatórios.", "error");
        return;
    }
    const eventDataToSave = {
      ...formData,
      dateTime: new Date(formData.dateTime).toISOString(),
      customName: formData.type === EventType.Outro ? formData.customName : formData.type,
    };
    if (event) {
      contextUpdateEvent({ ...eventDataToSave, id: event.id }); // Final save
    } else {
      contextAddEvent(eventDataToSave);
    }
    onClose();
  };
  
  const activeWorkers = useMemo(() => context?.workers.filter(w => w.status === 'Ativo') || [], [context?.workers]);
  const deacons = useMemo(() => activeWorkers.filter(w => w.position === WorkerPosition.Diacono || w.position === WorkerPosition.Obreiro || w.position === WorkerPosition.AuxiliarDeObra), [activeWorkers]);

  const commonInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";
  const commonInputSmStyles = `${commonInputStyles} text-sm`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-2 custom-scrollbar">
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Tipo de Evento</label>
        <select name="type" id="type" value={formData.type} onChange={handleChange} required className={commonInputStyles}>
          {Object.values(EventType).map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>
      {formData.type === EventType.Outro && (
        <div>
          <label htmlFor="customName" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome do Evento (Personalizado)</label>
          <input type="text" name="customName" id="customName" value={formData.customName} onChange={handleChange} required={formData.type === EventType.Outro} className={commonInputStyles} />
        </div>
      )}
       {(formData.type !== EventType.Outro) && (
        <div>
          <label htmlFor="customNameFixed" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome do Evento</label>
          <input type="text" name="customNameFixed" id="customNameFixed" value={formData.type} disabled className={`${commonInputStyles} bg-gray-100 dark:bg-slate-600`} />
        </div>
      )}
      <div>
        <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Data e Hora</label>
        <input type="datetime-local" name="dateTime" id="dateTime" value={formData.dateTime} onChange={handleChange} required className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Local</label>
        <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor="uniformId" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Uniforme</label>
        <select name="uniformId" id="uniformId" value={formData.uniformId} onChange={handleChange} className={commonInputStyles}>
          <option value="">Nenhum</option>
          {context?.uniforms.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <fieldset className="border dark:border-slate-600 p-4 rounded-md">
        <legend className="text-md font-medium text-gray-700 dark:text-slate-300 px-1">Escala / Responsabilidades</legend>
        <div className="space-y-3 mt-2">
            <div>
                <label htmlFor="responsibleDoor" className="block text-xs font-medium text-gray-600 dark:text-slate-400">Responsável pela Porta</label>
                <select name="responsibleDoor" id="responsibleDoor" value={formData.schedule.responsibleDoor} onChange={handleScheduleChange} className={commonInputSmStyles}>
                    <option value="">Ninguém</option>
                    {activeWorkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="responsibleClose" className="block text-xs font-medium text-gray-600 dark:text-slate-400">Responsável por Fechar</label>
                <select name="responsibleClose" id="responsibleClose" value={formData.schedule.responsibleClose} onChange={handleScheduleChange} className={commonInputSmStyles}>
                    <option value="">Ninguém</option>
                    {activeWorkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="responsiblePrayer" className="block text-xs font-medium text-gray-600 dark:text-slate-400">Responsável Oração Pré-Louvor</label>
                <select name="responsiblePrayer" id="responsiblePrayer" value={formData.schedule.responsiblePrayer} onChange={handleScheduleChange} className={commonInputSmStyles}>
                    <option value="">Ninguém</option>
                    {activeWorkers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="deaconsOnDuty" className="block text-xs font-medium text-gray-600 dark:text-slate-400">Diáconos/Auxiliares (selecione múltiplos)</label>
                <select multiple name="deaconsOnDuty" id="deaconsOnDuty" value={formData.schedule.deaconsOnDuty} onChange={handleScheduleChange} className={`${commonInputSmStyles} h-24`}>
                    {deacons.map(w => <option key={w.id} value={w.id}>{w.name} ({w.position})</option>)}
                </select>
            </div>
        </div>
      </fieldset>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Observações</label>
        <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className={commonInputStyles}></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-800 py-3 -mx-1 px-1 border-t dark:border-slate-700">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-md border border-gray-300 dark:border-slate-600">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">{event ? 'Concluído' : 'Adicionar Evento'}</button>
      </div>
    </form>
  );
};


const EventsPage: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const isAdmin = context?.currentUser?.accessLevel === UserAccessLevel.Admin;

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsFormModalOpen(true);
  };
  
  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsViewModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      context?.deleteEvent(eventId);
    }
  };
  
  const getWorkerName = (workerId?: string) => context?.workers.find(w => w.id === workerId)?.name || 'N/A';
  const getUniformName = (uniformId?: string) => context?.uniforms.find(u => u.id === uniformId)?.name || 'N/A';

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return context?.events
      .filter(event => {
        const eventDate = new Date(event.dateTime);
        if (filter === 'upcoming') return eventDate >= now;
        if (filter === 'past') return eventDate < now;
        return true;
      })
      .sort((a,b) => filter === 'past' 
        ? new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime() 
        : new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      ) || [];
  }, [context?.events, filter]);

  if (!context) return <p className="text-gray-700 dark:text-slate-300">Carregando...</p>;
  const eventNameDisplay = (event: Event) => event.type === EventType.Outro ? event.customName : event.type;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-4 sm:mb-0">Eventos e Escalas</h1>
        {isAdmin && (
          <button
            onClick={handleAddEvent}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition-colors"
            aria-label="Adicionar Novo Evento"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Adicionar Evento</span>
          </button>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center">
        <div className="flex items-center text-gray-600 dark:text-slate-300">
            <FilterIcon className="w-5 h-5 mr-2" />
            <span className="font-medium">Filtrar Eventos:</span>
        </div>
        <div className="flex space-x-2">
            {(['upcoming', 'past', 'all'] as const).map(f => (
                <button 
                    key={f} 
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${filter === f ? 'bg-sky-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
                >
                    {f === 'upcoming' ? 'Próximos' : f === 'past' ? 'Passados' : 'Todos'}
                </button>
            ))}
        </div>
         <span className="text-sm text-gray-500 dark:text-slate-400 sm:ml-auto">{filteredEvents.length} evento(s)</span>
      </div>

       <div className="space-y-4">
        {filteredEvents.map(event => (
          <div key={event.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
              <h2 className="text-xl font-semibold text-sky-700 dark:text-sky-400">{eventNameDisplay(event)}</h2>
              <span className="text-sm text-gray-500 dark:text-slate-400 bg-sky-100 dark:bg-sky-700/50 text-sky-700 dark:text-sky-300 px-3 py-1 rounded-full mt-2 sm:mt-0">
                {new Date(event.dateTime).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(event.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-gray-600 dark:text-slate-300 mb-1"><span className="font-medium">Local:</span> {event.location}</p>
            {event.uniformId && <p className="text-gray-600 dark:text-slate-300 mb-3"><span className="font-medium">Uniforme:</span> {getUniformName(event.uniformId)}</p>}
            
            <div className="mt-4 flex flex-wrap gap-2 items-center">
                <button onClick={() => handleViewEvent(event)} className="flex items-center text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-700/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-600/40 rounded-md transition-colors">
                    <EyeIcon className="w-4 h-4 mr-1.5" /> Ver Detalhes
                </button>
                {isAdmin && (
                    <>
                        <button onClick={() => handleEditEvent(event)} className="flex items-center text-sm px-3 py-1.5 bg-yellow-100 dark:bg-yellow-700/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-600/40 rounded-md transition-colors">
                            <EditIcon className="w-4 h-4 mr-1.5" /> Editar
                        </button>
                        <button onClick={() => handleDeleteEvent(event.id)} className="flex items-center text-sm px-3 py-1.5 bg-red-100 dark:bg-red-700/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-600/40 rounded-md transition-colors">
                            <TrashIcon className="w-4 h-4 mr-1.5" /> Excluir
                        </button>
                    </>
                )}
            </div>
          </div>
        ))}
      </div>
      {filteredEvents.length === 0 && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Nenhum evento encontrado com os filtros atuais.</p>}

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedEvent ? `Editar Evento: ${eventNameDisplay(selectedEvent)}` : 'Adicionar Novo Evento'} size="lg">
        <EventForm event={selectedEvent} onClose={() => setIsFormModalOpen(false)} />
      </Modal>

      {selectedEvent && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detalhes: ${eventNameDisplay(selectedEvent)}`} size="md">
            <div className="space-y-3 text-gray-700 dark:text-slate-300">
                <p><strong>Data e Hora:</strong> {new Date(selectedEvent.dateTime).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                <p><strong>Local:</strong> {selectedEvent.location}</p>
                {selectedEvent.uniformId && <p><strong>Uniforme:</strong> {getUniformName(selectedEvent.uniformId)}</p>}
                <div className="pt-2 mt-2 border-t dark:border-slate-700">
                    <h4 className="font-semibold mb-1">Escala:</h4>
                    {selectedEvent.schedule.responsibleDoor ? <p>Porta: {getWorkerName(selectedEvent.schedule.responsibleDoor)}</p> : <p className="text-sm italic">Porta: N/A</p>}
                    {selectedEvent.schedule.responsibleClose ? <p>Fechar Igreja: {getWorkerName(selectedEvent.schedule.responsibleClose)}</p> : <p className="text-sm italic">Fechar Igreja: N/A</p>}
                    {selectedEvent.schedule.responsiblePrayer ? <p>Oração Pré-Louvor: {getWorkerName(selectedEvent.schedule.responsiblePrayer)}</p> : <p className="text-sm italic">Oração Pré-Louvor: N/A</p>}
                    {selectedEvent.schedule.deaconsOnDuty && selectedEvent.schedule.deaconsOnDuty.length > 0 
                        ? <p>Diáconos/Auxiliares: {selectedEvent.schedule.deaconsOnDuty.map(getWorkerName).join(', ')}</p> 
                        : <p className="text-sm italic">Diáconos/Auxiliares: N/A</p>
                    }
                </div>
                {selectedEvent.notes && <p className="mt-2 pt-2 border-t dark:border-slate-700"><strong>Observações:</strong> {selectedEvent.notes}</p>}
                <div className="flex justify-end mt-4">
                    <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">Fechar</button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default EventsPage;