
import React from 'react';
import { 
  Users, 
  Calendar, 
  Play, 
  CheckCircle, 
  LogOut, 
  BarChart3, 
  Baby, 
  Key, 
  QrCode, 
  Phone,
  ChevronRight,
  ArrowLeft,
  Search,
  Plus,
  Info,
  Clock,
  LayoutDashboard
} from 'lucide-react';

export const COLORS = {
  purpleMain: '#7E3FA0',
  purpleDark: '#5E2D78',
  yellowMain: '#FFC800',
  yellowSecondary: '#FFD84D',
  white: '#FFFFFF',
  grayLight: '#F4F4F4',
  grayText: '#666666'
};

export const ADMIN_CREDENTIALS = {
  email: 'ieadmskids@ieadms.com.br',
  password: 'kids@2026'
};

export const ICONS = {
  Users: <Users className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  Play: <Play className="w-4 h-4" />,
  CheckCircle: <CheckCircle className="w-4 h-4" />,
  LogOut: <LogOut className="w-4 h-4" />,
  BarChart: <BarChart3 className="w-4 h-4" />,
  Baby: <Baby className="w-4 h-4" />,
  Key: <Key className="w-4 h-4" />,
  QrCode: <QrCode className="w-4 h-4" />,
  Phone: <Phone className="w-4 h-4" />,
  ChevronRight: <ChevronRight className="w-4 h-4" />,
  ArrowLeft: <ArrowLeft className="w-4 h-4" />,
  Search: <Search className="w-4 h-4" />,
  Plus: <Plus className="w-4 h-4" />,
  Info: <Info className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  Dashboard: <LayoutDashboard className="w-4 h-4" />
};

export const CULTO_TYPES: string[] = [
  'Santa Ceia',
  'Reunião de Obreiros',
  'Umademats',
  'CIFAD',
  'Outros'
];
