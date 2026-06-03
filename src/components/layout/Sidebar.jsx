import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, TestTube2, Globe, BarChart3,
  Upload, Settings, ChevronLeft, ChevronRight, FileCheck, PlayCircle
} from 'lucide-react';

const menuItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/requirements', icon: FileCheck, label: 'Requirements' },
  { to: '/testcases', icon: TestTube2, label: 'Test Cases' },
  { to: '/testruns', icon: PlayCircle, label: 'Test Runs' },
  { to: '/apihub', icon: Globe, label: 'API Hub' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/import-export', icon: Upload, label: 'Import / Export' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  return (
    <aside
      className="fixed top-0 left-0 h-full z-50 transition-all duration-300"
      style={{
        background: 'var(--color-sidebar)',
        borderRight: '1px solid var(--color-border)',
        width: collapsed ? '60px' : '240px',
      }}
    >
      <div className="flex items-center justify-between h-16 px-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {!collapsed && (
          <span className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
            QA Studio
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-sidebar-item-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="p-2 space-y-1">
        {menuItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              background: isActive ? 'var(--color-sidebar-item-active)' : 'transparent',
              boxShadow: isActive ? 'inset 2px 0 0 0 var(--color-primary)' : 'none',
              transition: 'all 0.15s ease',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.getAttribute('data-active') === 'true') {
                e.currentTarget.style.background = 'var(--color-sidebar-item-hover)';
              }
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.getAttribute('data-active') === 'true') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
