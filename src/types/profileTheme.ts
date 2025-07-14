export interface CustomProfileTheme {
  primaryColor: string;
  accentColor: string;
}

export interface ProfileTheme {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
}

export const COLOR_PALETTE = {
  primary: [
    { name: 'Azul', value: '#3B82F6', gradient: 'from-blue-500 to-blue-600' },
    { name: 'Púrpura', value: '#8B5CF6', gradient: 'from-purple-500 to-purple-600' },
    { name: 'Rosa', value: '#EC4899', gradient: 'from-pink-500 to-pink-600' },
    { name: 'Rojo', value: '#EF4444', gradient: 'from-red-500 to-red-600' },
    { name: 'Naranja', value: '#F97316', gradient: 'from-orange-500 to-orange-600' },
    { name: 'Amarillo', value: '#EAB308', gradient: 'from-yellow-500 to-yellow-600' },
    { name: 'Verde', value: '#22C55E', gradient: 'from-green-500 to-green-600' },
    { name: 'Esmeralda', value: '#10B981', gradient: 'from-emerald-500 to-emerald-600' },
    { name: 'Turquesa', value: '#14B8A6', gradient: 'from-teal-500 to-teal-600' },
    { name: 'Cian', value: '#06B6D4', gradient: 'from-cyan-500 to-cyan-600' },
    { name: 'Índigo', value: '#6366F1', gradient: 'from-indigo-500 to-indigo-600' },
    { name: 'Violeta', value: '#7C3AED', gradient: 'from-violet-500 to-violet-600' }
  ],
  accent: [
    { name: 'Azul Claro', value: '#60A5FA', gradient: 'from-blue-400 to-blue-500' },
    { name: 'Púrpura Claro', value: '#A78BFA', gradient: 'from-purple-400 to-purple-500' },
    { name: 'Rosa Claro', value: '#F472B6', gradient: 'from-pink-400 to-pink-500' },
    { name: 'Rojo Claro', value: '#F87171', gradient: 'from-red-400 to-red-500' },
    { name: 'Naranja Claro', value: '#FB923C', gradient: 'from-orange-400 to-orange-500' },
    { name: 'Amarillo Claro', value: '#FACC15', gradient: 'from-yellow-400 to-yellow-500' },
    { name: 'Verde Claro', value: '#4ADE80', gradient: 'from-green-400 to-green-500' },
    { name: 'Esmeralda Claro', value: '#34D399', gradient: 'from-emerald-400 to-emerald-500' },
    { name: 'Turquesa Claro', value: '#2DD4BF', gradient: 'from-teal-400 to-teal-500' },
    { name: 'Cian Claro', value: '#22D3EE', gradient: 'from-cyan-400 to-cyan-500' },
    { name: 'Índigo Claro', value: '#818CF8', gradient: 'from-indigo-400 to-indigo-500' },
    { name: 'Violeta Claro', value: '#8B5CF6', gradient: 'from-violet-400 to-violet-500' }
  ]
};

export const PROFILE_THEMES: ProfileTheme[] = [
  {
    id: 'default',
    name: 'Predeterminado',
    primaryColor: 'from-blue-600 to-purple-600',
    accentColor: 'bg-blue-600',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-purple-600',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-900/30'
  },
  {
    id: 'red',
    name: 'Rojo Pasión',
    primaryColor: 'from-red-500 to-pink-600',
    accentColor: 'bg-red-500',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-pink-600',
    textColor: 'text-red-400',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-900/30'
  },
  {
    id: 'green',
    name: 'Verde Natural',
    primaryColor: 'from-green-500 to-emerald-600',
    accentColor: 'bg-green-500',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-600',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-900/30'
  },
  {
    id: 'purple',
    name: 'Púrpura Real',
    primaryColor: 'from-purple-500 to-violet-600',
    accentColor: 'bg-purple-500',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-600',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-900/30'
  },
  {
    id: 'orange',
    name: 'Naranja Energía',
    primaryColor: 'from-orange-500 to-amber-600',
    accentColor: 'bg-orange-500',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-600',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-900/30'
  },
  {
    id: 'teal',
    name: 'Turquesa Fresco',
    primaryColor: 'from-teal-500 to-cyan-600',
    accentColor: 'bg-teal-500',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-cyan-600',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500',
    bgColor: 'bg-teal-900/30'
  },
  {
    id: 'pink',
    name: 'Rosa Elegante',
    primaryColor: 'from-pink-500 to-rose-600',
    accentColor: 'bg-pink-500',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-600',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500',
    bgColor: 'bg-pink-900/30'
  },
  {
    id: 'indigo',
    name: 'Índigo Profundo',
    primaryColor: 'from-indigo-500 to-blue-600',
    accentColor: 'bg-indigo-500',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-blue-600',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500',
    bgColor: 'bg-indigo-900/30'
  },
  {
    id: 'yellow',
    name: 'Dorado Solar',
    primaryColor: 'from-yellow-500 to-orange-500',
    accentColor: 'bg-yellow-500',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-orange-500',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-900/30'
  }
];