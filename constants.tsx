
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
  LayoutDashboard,
  X
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
  Users: <Users className="w-[18px] h-[18px]" />,
  Calendar: <Calendar className="w-[18px] h-[18px]" />,
  Play: <Play className="w-[18px] h-[18px]" />,
  CheckCircle: <CheckCircle className="w-[18px] h-[18px]" />,
  LogOut: <LogOut className="w-[18px] h-[18px]" />,
  BarChart: <BarChart3 className="w-[18px] h-[18px]" />,
  Baby: <Baby className="w-[18px] h-[18px]" />,
  Key: <Key className="w-[18px] h-[18px]" />,
  QrCode: <QrCode className="w-[18px] h-[18px]" />,
  Phone: <Phone className="w-[18px] h-[18px]" />,
  ChevronRight: <ChevronRight className="w-[18px] h-[18px]" />,
  ArrowLeft: <ArrowLeft className="w-[18px] h-[18px]" />,
  Search: <Search className="w-[18px] h-[18px]" />,
  Plus: <Plus className="w-[18px] h-[18px]" />,
  Info: <Info className="w-[18px] h-[18px]" />,
  Clock: <Clock className="w-[18px] h-[18px]" />,
  Dashboard: <LayoutDashboard className="w-[18px] h-[18px]" />,
  X: <X className="w-[18px] h-[18px]" />
};

export const CULTO_TYPES: string[] = [
  'Santa Ceia',
  'Reunião de Obreiros',
  'Umademats',
  'CIFAD',
  'Outros'
];
