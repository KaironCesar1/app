
import React, { useContext, useMemo, useEffect, useState }from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import { AppContextType, Event, Worker, Uniform, WorkerStatus } from '../types';
import { CalendarIcon, UsersIcon, ShirtIcon } from '../components/common/IconCatalog';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Minimal Worker Info Pill for public page
const PublicWorkerInfoPill: React.FC<{ worker?: Worker }> = ({ worker }) => {
  if (!worker) return <span className="text-xs italic text-slate-600 dark:text-slate-400">N/A</span>;
  return (
    <div className="flex items-center space-x-1.5 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md mb-1 mr-1">
      {worker.photoUrl ? (
        <img src={worker.photoUrl} alt={worker.name} className="w-5 h-5 rounded-full object-cover" />
      ) : (
        <div className="w-5 h-5 rounded-full bg-slate-400 dark:bg-slate-500 flex items-center justify-center text-white text-xs">
          {worker.name.charAt(0)}
        </div>
      )}
      <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{worker.name}</span>
    </div>
  );
};


const PublicEventsPage: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const query = useQuery();
  const accessKey = query.get('key');
  const [isLoading, setIsLoading] = useState(true); // For initial data load from context

  useEffect(() => {
    if (context && context.appSettings) { // Wait for context to be populated
        setIsLoading(false);
    }
  }, [context]);


  if (isLoading || !context || !context.appSettings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <p className="text-slate-600 dark:text-slate-300">Carregando...</p>
      </div>
    );
  }

  const { appSettings, workers, events, uniforms } = context;

  if (!appSettings.publicEventsEnabled || appSettings.publicEventsKey !== accessKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Acesso Negado</h1>
          <p className="text-slate-700 dark:text-slate-300">Esta página não está habilitada ou a chave de acesso é inválida.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Entre em contato com o administrador da igreja.</p>
        </div>
      </div>
    );
  }

  const getWorkerById = (workerId?: string): Worker | undefined => workers.find(w => w.id === workerId && w.status === WorkerStatus.Active);
  const getUniformById = (uniformId?: string): Uniform | undefined => uniforms.find(u => u.id === uniformId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextSevenDays = new Date();
  nextSevenDays.setDate(today.getDate() + 7);
  nextSevenDays.setHours(23,59,59,999);


  const relevantEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = new Date(event.dateTime);
        return eventDate >= today && eventDate <= nextSevenDays;
      })
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [events, today, nextSevenDays]);

  const appName = appSettings.churchLogoUrl ? (
    <img src={appSettings.churchLogoUrl} alt="Logo da Igreja" className="h-12 mx-auto mb-2 object-contain" />
  ) : (
    "Obreiro Fiel ADACMM"
  );
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <div className="inline-block">
         {appName}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-sky-700 dark:text-sky-400">Eventos da Semana</h1>
        <p className="text-slate-600 dark:text-slate-300">Programação e escalas para os próximos 7 dias.</p>
      </header>

      {relevantEvents.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 text-lg">Nenhum evento programado para os próximos 7 dias.</p>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
          {relevantEvents.map(event => (
            <div key={event.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl sm:text-2xl font-semibold text-sky-600 dark:text-sky-300">{event.customName || event.type}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(event.dateTime).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' às '}
                  {new Date(event.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Local: {event.location}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {event.uniformId && getUniformById(event.uniformId) && (
                  <div className="flex items-start space-x-2 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <ShirtIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="block text-slate-700 dark:text-slate-200">Uniforme:</strong>
                      <span className="text-slate-600 dark:text-slate-300">{getUniformById(event.uniformId)?.name}</span>
                    </div>
                  </div>
                )}
                
                <div className="sm:col-span-2 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                   <div className="flex items-start space-x-2 mb-1">
                     <UsersIcon className="w-5 h-5 text-teal-500 dark:text-teal-400 mt-0.5 shrink-0" />
                     <strong className="block text-slate-700 dark:text-slate-200">Escala:</strong>
                   </div>
                  <div className="pl-0 space-y-1">
                    {event.schedule.responsibleDoor && <div><span className="font-medium text-slate-600 dark:text-slate-300">Porta:</span> <PublicWorkerInfoPill worker={getWorkerById(event.schedule.responsibleDoor)} /></div>}
                    {event.schedule.responsiblePrayer && <div><span className="font-medium text-slate-600 dark:text-slate-300">Oração:</span> <PublicWorkerInfoPill worker={getWorkerById(event.schedule.responsiblePrayer)} /></div>}
                     {event.schedule.deaconsOnDuty && event.schedule.deaconsOnDuty.length > 0 && (
                      <div>
                        <span className="font-medium text-slate-600 dark:text-slate-300">Diáconos/Aux.:</span>
                        <div className="flex flex-wrap mt-0.5">
                          {event.schedule.deaconsOnDuty.map(id => <PublicWorkerInfoPill key={id} worker={getWorkerById(id)} />)}
                        </div>
                      </div>
                    )}
                    {event.schedule.responsibleClose && <div><span className="font-medium text-slate-600 dark:text-slate-300">Fechar:</span> <PublicWorkerInfoPill worker={getWorkerById(event.schedule.responsibleClose)} /></div>}
                     {!(event.schedule.responsibleDoor || event.schedule.responsiblePrayer || (event.schedule.deaconsOnDuty && event.schedule.deaconsOnDuty.length > 0) || event.schedule.responsibleClose) && <p className="text-xs italic text-slate-500 dark:text-slate-400">Nenhuma escala definida.</p>}
                  </div>
                </div>
              </div>
               {event.notes && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic border-t border-slate-200 dark:border-slate-700 pt-2">Obs: {event.notes}</p>}
            </div>
          ))}
        </div>
      )}
       <footer className="text-center mt-12 text-xs text-slate-400 dark:text-slate-500">
        <p>&copy; {new Date().getFullYear()} {appSettings.churchLogoUrl ? 'Igreja' : 'Obreiro Fiel ADACMM'}. Todos os direitos reservados.</p>
        <p>Este é um link de visualização pública. As informações podem ser atualizadas.</p>
      </footer>
    </div>
  );
};

export default PublicEventsPage;