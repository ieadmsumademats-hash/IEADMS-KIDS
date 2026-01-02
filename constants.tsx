
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
  Users: <Users className="w-5 h-5" />,
  Calendar: <Calendar className="w-5 h-5" />,
  Play: <Play className="w-5 h-5" />,
  CheckCircle: <CheckCircle className="w-5 h-5" />,
  LogOut: <LogOut className="w-5 h-5" />,
  BarChart: <BarChart3 className="w-5 h-5" />,
  Baby: <Baby className="w-5 h-5" />,
  Key: <Key className="w-5 h-5" />,
  QrCode: <QrCode className="w-5 h-5" />,
  Phone: <Phone className="w-5 h-5" />,
  ChevronRight: <ChevronRight className="w-5 h-5" />,
  ArrowLeft: <ArrowLeft className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  Plus: <Plus className="w-5 h-5" />,
  Info: <Info className="w-5 h-5" />,
  Clock: <Clock className="w-5 h-5" />,
  Dashboard: <LayoutDashboard className="w-5 h-5" />
};

export const CULTO_TYPES: string[] = [
  'Santa Ceia',
  'Reunião de Obreiros',
  'Umademats',
  'CIFAD',
  'Outros'
];
