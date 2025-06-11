
import React, { useContext, useState, useRef, useCallback } from 'react';
import { AppContext } from '../App';
import { AppContextType, AppSettings } from '../types';
import { QrCodeIcon, LinkIcon, EditIcon, CameraIcon, PhotoIcon } from '../components/common/IconCatalog';

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

const AdminSettingsPage: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const { appSettings, updateAppSettings, showToast } = context;
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateAppSettings({ churchLogoUrl: reader.result as string });
        // showToast is called by updateAppSettings
      };
      reader.readAsDataURL(file);
    } else {
      showToast('Por favor, selecione um arquivo PNG ou JPG.', 'error');
    }
     if(event.target) event.target.value = ''; // Allow re-uploading same file
  };

  const handleRemoveLogo = () => {
    updateAppSettings({ churchLogoUrl: '' });
  };

  const handleTogglePublicEvents = (enabled: boolean) => {
    updateAppSettings({ publicEventsEnabled: enabled });
  };

  const handleRegenerateKey = () => {
    const newKey = `key${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5)}`;
    updateAppSettings({ publicEventsKey: newKey });
  };

  const publicLink = `${window.location.origin}${window.location.pathname}#/public-events?key=${appSettings.publicEventsKey}`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicLink)
      .then(() => showToast('Link público copiado!', 'success'))
      .catch(() => showToast('Falha ao copiar o link.', 'error'));
  };
  
  const debouncedUpdateAppSettings = useCallback(
    debounce((newSettings: Partial<AppSettings>) => {
      updateAppSettings(newSettings);
    }, 1000),
    [updateAppSettings] 
  );


  return (
    <div className="space-y-8">
      <header className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Configurações Administrativas</h1>
      </header>

      {/* Logo Section */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Logo da Igreja</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-32 h-32 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-300 dark:border-slate-600">
            {appSettings.churchLogoUrl ? (
              <img src={appSettings.churchLogoUrl} alt="Logo Atual" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400">Sem logo</span>
            )}
          </div>
          <div className="space-y-2 flex-grow">
            <input type="file" accept="image/png, image/jpeg" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
            <button
              onClick={() => logoInputRef.current?.click()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md shadow hover:bg-blue-600 transition-colors text-sm"
            >
              <CameraIcon className="w-5 h-5" />
              <span>{appSettings.churchLogoUrl ? 'Alterar Logo' : 'Carregar Logo'}</span>
            </button>
            {appSettings.churchLogoUrl && (
              <button
                onClick={handleRemoveLogo}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-md shadow hover:bg-red-600 transition-colors text-sm"
              >
                <span>Remover Logo</span>
              </button>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">Use arquivos PNG ou JPG. A logo aparecerá no topo do aplicativo.</p>
          </div>
        </div>
      </section>

      {/* Public Events Link Section */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">Link Público de Eventos</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="publicEventsToggle" className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Habilitar página pública de eventos:
            </label>
            <button
              id="publicEventsToggle"
              onClick={() => handleTogglePublicEvents(!appSettings.publicEventsEnabled)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${
                appSettings.publicEventsEnabled ? 'bg-sky-600' : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <span className="sr-only">Habilitar eventos públicos</span>
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                  appSettings.publicEventsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {appSettings.publicEventsEnabled && (
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Seu link público:</p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input type="text" readOnly value={publicLink} className="flex-grow p-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-sm dark:text-slate-300" />
                  <button onClick={copyPublicLink} className="px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-1.5">
                    <LinkIcon className="w-4 h-4" />
                    <span>Copiar</span>
                  </button>
                </div>
              </div>
              <button
                onClick={handleRegenerateKey}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
              >
                Gerar nova chave para o link (invalidará o link atual)
              </button>
              
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">QR Code para o link público:</p>
                <div className="p-2 border border-gray-300 dark:border-slate-600 rounded-md inline-block bg-white">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicLink)}&qzone=1`} 
                    alt="QR Code Link Público" 
                    className="w-36 h-36"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminSettingsPage;