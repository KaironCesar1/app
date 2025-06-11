
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { Event, Worker, Uniform, UserAccessLevel, WorkerPosition, WorkerStatus, AppContextType } from '../types';
import { Link } from 'react-router-dom';
import { CalendarIcon, UsersIcon, ShirtIcon, WhatsAppIcon } from '../components/common/IconCatalog';

const InfoCard: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode; bgColorClass?: string; className?: string }> = ({ title, children, icon, bgColorClass = 'bg-sky-600 dark:bg-sky-700', className }) => (
  <div className={`p-6 rounded-xl shadow-lg text-white ${bgColorClass} ${className}`}>
    <div className="flex items-center mb-4">
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-8 h-8 mr-3 text-white text-opacity-80' })}
      <h2 className="text-2xl font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);

const WorkerInfoPill: React.FC<{ worker?: Worker }> = ({ worker }) => {
  if (!worker) return <span className="text-sm italic">N/A</span>;

  const formattedPhone = worker.phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${formattedPhone.startsWith('55') ? formattedPhone : '55' + formattedPhone}`;

  return (
    <div className="flex items-center space-x-2 bg-white/20 dark:bg-black/20 px-3 py-1.5 rounded-lg mb-1 mr-1">
      <img src={worker.photoUrl || `https://ui-avatars.com/api/?name=${worker.name.replace(/\s+/g, '+')}&background=random&color=fff&size=32`} alt={worker.name} className="w-6 h-6 rounded-full object-cover" />
      <span className="text-sm font-medium">{worker.name}</span>
      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-green-300 hover:text-green-100 transition-colors" title={`Conversar com ${worker.name} no WhatsApp`}>
        <WhatsAppIcon className="w-5 h-5" />
      </a>
    </div>
  );
};


const DashboardPage: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;

  if (!context || !context.currentUser) {
    return <p className="text-center text-gray-500 dark:text-gray-400">Carregando dados do usuário...</p>;
  }
  
  const { currentUser, workers, events, uniforms } = context;

  const getWorkerById = (workerId?: string): Worker | undefined => workers.find(w => w.id === workerId);
  const getUniformById = (uniformId?: string): Uniform | undefined => uniforms.find(u => u.id === uniformId);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const todaysEvents = useMemo(() => {
    return events
      .filter(event => {
        const eventDate = new Date(event.dateTime);
        eventDate.setHours(0,0,0,0);
        return eventDate.getTime() === today.getTime();
      })
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [events, today]);

  const eventOfTheDay = useMemo(() => todaysEvents.length > 0 ? todaysEvents[0] : null, [todaysEvents]);
  
  const upcomingEvents = useMemo(() => {
    return events
      .filter(event => new Date(event.dateTime) >= new Date()) // All upcoming or today
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 5); // Show next 5
  }, [events]);
  
  const birthdaysThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    return workers.filter(worker => new Date(worker.dob).getMonth() === currentMonth && worker.status === WorkerStatus.Active);
  }, [workers]);

  const workerName = currentUser.workerId ? getWorkerById(currentUser.workerId)?.name : currentUser.username;


  return (
    <div className="space-y-8">
      <header className="pb-6 border-b border-gray-200 dark:border-slate-700">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-slate-100">Bem-vindo, {workerName}!</h1>
        <p className="text-lg text-gray-600 dark:text-slate-300">Seu painel de gerenciamento da ADACMM.</p>
      </header>

      {/* Today's Info Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InfoCard title="Evento do Dia" icon={<CalendarIcon />} bgColorClass="bg-gradient-to-br from-sky-600 to-cyan-500 dark:from-sky-700 dark:to-cyan-600" className="lg:col-span-1">
          {eventOfTheDay ? (
            <div className="space-y-2">
              <h3 className="text-xl font-bold">{eventOfTheDay.customName || eventOfTheDay.type}</h3>
              <p><span className="font-semibold">Horário:</span> {new Date(eventOfTheDay.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p><span className="font-semibold">Local:</span> {eventOfTheDay.location}</p>
              {eventOfTheDay.notes && <p className="text-sm italic opacity-90">Obs: {eventOfTheDay.notes}</p>}
            </div>
          ) : (
            <p>Nenhum evento programado para hoje.</p>
          )}
        </InfoCard>

        <InfoCard title="Escala do Dia" icon={<UsersIcon />} bgColorClass="bg-gradient-to-br from-teal-600 to-emerald-500 dark:from-teal-700 dark:to-emerald-600" className="lg:col-span-1">
          {eventOfTheDay && eventOfTheDay.schedule ? (
            <div className="space-y-3">
              {eventOfTheDay.schedule.responsibleDoor && <div><strong className="block text-sm opacity-80 mb-0.5">Porta:</strong> <WorkerInfoPill worker={getWorkerById(eventOfTheDay.schedule.responsibleDoor)} /></div>}
              {eventOfTheDay.schedule.responsiblePrayer && <div><strong className="block text-sm opacity-80 mb-0.5">Oração Pré-Louvor:</strong> <WorkerInfoPill worker={getWorkerById(eventOfTheDay.schedule.responsiblePrayer)} /></div>}
              {eventOfTheDay.schedule.deaconsOnDuty && eventOfTheDay.schedule.deaconsOnDuty.length > 0 && (
                <div>
                  <strong className="block text-sm opacity-80 mb-0.5">Diáconos/Auxiliares:</strong>
                  <div className="flex flex-wrap">
                    {eventOfTheDay.schedule.deaconsOnDuty.map(id => <WorkerInfoPill key={id} worker={getWorkerById(id)} />)}
                  </div>
                </div>
              )}
              {eventOfTheDay.schedule.responsibleClose && <div><strong className="block text-sm opacity-80 mb-0.5">Fechar Igreja:</strong> <WorkerInfoPill worker={getWorkerById(eventOfTheDay.schedule.responsibleClose)} /></div>}
              {!(eventOfTheDay.schedule.responsibleDoor || eventOfTheDay.schedule.responsiblePrayer || (eventOfTheDay.schedule.deaconsOnDuty && eventOfTheDay.schedule.deaconsOnDuty.length > 0) || eventOfTheDay.schedule.responsibleClose) && <p>Nenhuma escala definida para este evento.</p>}
            </div>
          ) : (
            <p>Nenhuma escala para hoje.</p>
          )}
        </InfoCard>

        <InfoCard title="Uniforme do Dia" icon={<ShirtIcon />} bgColorClass="bg-gradient-to-br from-indigo-600 to-purple-500 dark:from-indigo-700 dark:to-purple-600" className="lg:col-span-1">
          {eventOfTheDay && eventOfTheDay.uniformId ? (
            <p className="text-xl font-bold">{getUniformById(eventOfTheDay.uniformId)?.name || 'N/A'}</p>
          ) : eventOfTheDay ? (
            <p>Nenhum uniforme especificado para o evento de hoje.</p>
          ) : (
             <p>Nenhum evento hoje.</p>
          )}
        </InfoCard>
      </section>

      {/* Upcoming Events Section */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-slate-200 mb-6">Próximos Eventos</h2>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-4">
            {upcomingEvents.map((event: Event) => (
              <div key={event.id} className="p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow bg-gray-50 dark:bg-slate-800/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                  <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-400">{event.customName || event.type}</h3>
                  <span className="text-xs text-gray-500 dark:text-slate-400 bg-sky-100 dark:bg-sky-700/50 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full mt-1 sm:mt-0">
                    {new Date(event.dateTime).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })} às {new Date(event.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-1"><span className="font-medium">Local:</span> {event.location}</p>
                {event.uniformId && <p className="text-sm text-gray-600 dark:text-slate-300"><span className="font-medium">Uniforme:</span> {getUniformById(event.uniformId)?.name || 'N/A'}</p>}
                <div className="mt-3">
                    <Link to="/events" state={{ eventId: event.id }} className="text-sm text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 font-medium">
                        Ver detalhes &rarr;
                    </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-slate-400">Nenhum evento programado.</p>
        )}
      </section>

      {/* Birthdays this month - Admin view */}
      {currentUser.accessLevel === UserAccessLevel.Admin && birthdaysThisMonth.length > 0 && (
        <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Aniversariantes Ativos do Mês</h2>
          <ul className="space-y-3">
            {birthdaysThisMonth.map((worker: Worker) => (
              <li key={worker.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-800/30 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="flex items-center space-x-3">
                  <img src={worker.photoUrl || `https://ui-avatars.com/api/?name=${worker.name.replace(/\s+/g, '+')}&background=random`} alt={worker.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-slate-100">{worker.name}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{worker.position}</p>
                  </div>
                </div>
                <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">{new Date(worker.dob).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;