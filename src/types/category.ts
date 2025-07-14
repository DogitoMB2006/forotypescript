export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'games',
    name: 'Juegos',
    description: 'Discusiones sobre videojuegos, reviews, noticias',
    icon: '🎮',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500/50'
  },
  {
    id: 'offtopic',
    name: 'Off Topic',
    description: 'Conversaciones generales y temas diversos',
    icon: '💬',
    color: 'text-green-400',
    bgColor: 'bg-green-900/30',
    borderColor: 'border-green-500/50'
  },
  {
    id: 'tutorials',
    name: 'Tutoriales',
    description: 'Guías, tutoriales y contenido educativo',
    icon: '📚',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500/50'
  },
  {
    id: 'applications',
    name: 'Aplicaciones',
    description: 'Software, apps, herramientas y desarrollo',
    icon: '💻',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/30',
    borderColor: 'border-orange-500/50'
  }
];