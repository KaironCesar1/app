
import React, { useState, useContext, useMemo, useEffect, useCallback } from 'react';
import { AppContext } from '../App';
import { Uniform, UserAccessLevel, AppContextType } from '../types';
import { Modal } from '../components/common/Modal';
import { PlusIcon, EditIcon, TrashIcon } from '../components/common/IconCatalog';

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

const UniformForm: React.FC<{ uniform?: Uniform; onClose: () => void; }> = ({ uniform, onClose }) => {
  const context = useContext(AppContext) as AppContextType;
  const [formData, setFormData] = useState<Omit<Uniform, 'id'>>({
    name: uniform?.name || '',
    description: uniform?.description || '',
  });

  const { updateUniform: contextUpdateUniform, addUniform: contextAddUniform, showToast } = context;

  const debouncedSave = useCallback(
    debounce(async (currentData: Omit<Uniform, 'id'>) => {
      if (!currentData.name.trim()) {
        // Don't save if name is empty, but don't show error toast on every keystroke.
        // Validation will be handled on explicit submit if adding new.
        return;
      }
      if (uniform) { // Editing existing uniform
        contextUpdateUniform({ ...currentData, id: uniform.id });
      }
    }, 1500),
    [uniform, contextUpdateUniform, showToast]
  );

  useEffect(() => {
    if (uniform) { // Only auto-save if editing an existing uniform
      debouncedSave(formData);
    }
  }, [formData, uniform, debouncedSave]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        showToast("O nome do uniforme é obrigatório.", "error");
        return;
    }
    if (uniform) {
      contextUpdateUniform({ ...formData, id: uniform.id }); // Final save
    } else {
      contextAddUniform(formData);
    }
    onClose();
  };
  
  const commonInputStyles = "mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome do Uniforme</label>
        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={commonInputStyles} />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Descrição (Opcional)</label>
        <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className={commonInputStyles}></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t dark:border-slate-700">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-md border border-gray-300 dark:border-slate-500">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm">{uniform ? 'Concluído' : 'Adicionar Uniforme'}</button>
      </div>
    </form>
  );
};

const UniformsPage: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUniform, setEditingUniform] = useState<Uniform | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = context?.currentUser?.accessLevel === UserAccessLevel.Admin;

  const handleAddUniform = () => {
    setEditingUniform(undefined);
    setIsModalOpen(true);
  };

  const handleEditUniform = (uniform: Uniform) => {
    setEditingUniform(uniform);
    setIsModalOpen(true);
  };

  const handleDeleteUniform = (uniformId: string) => {
    const isInUse = context?.events.some(event => event.uniformId === uniformId);
    if (isInUse) {
      alert('Este uniforme está sendo usado em um ou mais eventos e não pode ser excluído. Remova-o dos eventos primeiro.');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este uniforme?')) {
      context?.deleteUniform(uniformId);
    }
  };

  const filteredUniforms = useMemo(() => {
    return context?.uniforms
        .filter(uniform => uniform.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a,b) => a.name.localeCompare(b.name)) || [];
  }, [context?.uniforms, searchTerm]);

  if (!context) return <p className="text-gray-700 dark:text-slate-300">Carregando...</p>;
  if (!isAdmin) {
      return <p className="text-center text-red-500">Acesso não autorizado.</p>;
  }

  const commonInputStyles = "block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-4 sm:mb-0">Gerenciamento de Uniformes</h1>
        {isAdmin && (
          <button
            onClick={handleAddUniform}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700 transition-colors"
            aria-label="Adicionar Novo Uniforme"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Adicionar Uniforme</span>
          </button>
        )}
      </div>
      
      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
          <label htmlFor="searchTermUniform" className="sr-only">Buscar Uniforme</label>
          <input
            type="text"
            id="searchTermUniform"
            placeholder="Buscar por nome do uniforme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={commonInputStyles}
          />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUniforms.map(uniform => (
          <div key={uniform.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-sky-700 dark:text-sky-400 mb-2">{uniform.name}</h2>
              <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 h-16 overflow-y-auto custom-scrollbar">{uniform.description || 'Sem descrição.'}</p>
            </div>
            {isAdmin && (
              <div className="flex justify-end space-x-3 mt-auto pt-4 border-t border-gray-200 dark:border-slate-700">
                <button onClick={() => handleEditUniform(uniform)} className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-700/30 rounded-full transition-colors" aria-label={`Editar ${uniform.name}`}><EditIcon className="w-5 h-5" /></button>
                <button onClick={() => handleDeleteUniform(uniform.id)} className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-700/30 rounded-full transition-colors" aria-label={`Excluir ${uniform.name}`}><TrashIcon className="w-5 h-5" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
      {filteredUniforms.length === 0 && <p className="text-center text-gray-500 dark:text-slate-400 py-8">Nenhum uniforme encontrado.</p>}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUniform ? 'Editar Uniforme' : 'Adicionar Novo Uniforme'}>
        <UniformForm uniform={editingUniform} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default UniformsPage;