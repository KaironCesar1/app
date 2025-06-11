
import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppContext } from '../../App';
import { AppContextType, UserAccessLevel } from '../../types';
import { HomeIcon, UsersIcon, CalendarIcon, ShirtIcon, UserCircleIcon, SettingsIcon, LogoutIcon, MenuIcon, XIcon } from './IconCatalog';

const TopBar: React.FC = () => {
  const context = useContext(AppContext) as AppContextType;
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);


  const { currentUser, appSettings, setCurrentUser } = context;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  if (!currentUser) return null;

  const handleLogout = () => {
    setCurrentUser(null);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon, roles: [UserAccessLevel.Admin, UserAccessLevel.Obreiro] },
    { path: '/workers', label: 'Obreiros', icon: UsersIcon, roles: [UserAccessLevel.Admin] },
    { path: '/events', label: 'Eventos & Escalas', icon: CalendarIcon, roles: [UserAccessLevel.Admin, UserAccessLevel.Obreiro] },
    { path: '/uniforms', label: 'Uniformes', icon: ShirtIcon, roles: [UserAccessLevel.Admin] },
    { path: '/account-settings', label: 'Minha Conta', icon: UserCircleIcon, roles: [UserAccessLevel.Admin, UserAccessLevel.Obreiro] },
    { path: '/admin-settings', label: 'Configurações', icon: SettingsIcon, roles: [UserAccessLevel.Admin] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.accessLevel));

  const NavLink: React.FC<{path: string, label: string, Icon: React.FC<any>, onClick?: () => void}> = ({path, label, Icon, onClick}) => {
    const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
    return (
         <Link
            to={path}
            onClick={() => {
                setMobileMenuOpen(false);
                if(onClick) onClick();
            }}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors text-sm font-medium
                        ${isActive ? 'bg-sky-600 text-white shadow-md' : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'}`}
        >
            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-sky-600 dark:text-sky-400'}`} />
            <span>{label}</span>
        </Link>
    )
  }

  return (
    <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/App Name */}
          <Link to="/dashboard" className="flex items-center space-x-2 shrink-0" onClick={() => setMobileMenuOpen(false)}>
            {appSettings.churchLogoUrl ? (
              <img src={appSettings.churchLogoUrl} alt="Logo da Igreja" className="h-10 w-auto object-contain" />
            ) : (
              <span className="text-xl font-bold text-sky-600 dark:text-sky-400">Obreiro Fiel ADACMM</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {filteredNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`p-2 rounded-md transition-colors ${ (location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path))) ? 'bg-sky-100 dark:bg-sky-700 text-sky-600 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <item.icon className="w-5 h-5" />
              </Link>
            ))}
            <button
              onClick={handleLogout}
              title="Sair"
              className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-700 hover:text-red-600 dark:hover:text-red-200 transition-colors"
            >
              <LogoutIcon className="w-5 h-5" />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Abrir menu</span>
              {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div ref={menuRef} className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-slate-800 shadow-lg z-50 p-4 border-t dark:border-slate-700" id="mobile-menu">
          <nav className="space-y-2">
            {filteredNavItems.map(item => (
              <NavLink key={item.path} path={item.path} label={item.label} Icon={item.icon} />
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors font-medium text-sm"
            >
              <LogoutIcon className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default TopBar;