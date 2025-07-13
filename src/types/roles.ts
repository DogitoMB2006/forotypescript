export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  priority: number; // Menor número = mayor prioridad
  badgeId?: string; // Badge asociado al rol
}

export interface Permission {
  action: string;
  resource: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
}

export interface UserRoleWithDetails extends UserRole {
  role: Role;
}

// Definición de roles del sistema
export const ROLES: Role[] = [
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Administrador',
    description: 'Administrador del foro con acceso completo',
    priority: 1,
    permissions: [
      { action: 'delete', resource: 'posts' },
      { action: 'delete', resource: 'comments' },
      { action: 'manage', resource: 'users' },
      { action: 'assign', resource: 'roles' },
      { action: 'assign', resource: 'badges' },
      { action: 'moderate', resource: 'content' }
    ],
    badgeId: 'Staff-Forum'
  },
  {
    id: 'moderator',
    name: 'moderator',
    displayName: 'Moderador',
    description: 'Moderador del foro que puede eliminar contenido',
    priority: 2,
    permissions: [
      { action: 'delete', resource: 'posts' },
      { action: 'delete', resource: 'comments' },
      { action: 'moderate', resource: 'content' }
    ],
    badgeId: 'moderator'
  },
  {
    id: 'member',
    name: 'member',
    displayName: 'Miembro',
    description: 'Usuario estándar del foro',
    priority: 3,
    permissions: [
      { action: 'create', resource: 'posts' },
      { action: 'create', resource: 'comments' },
      { action: 'like', resource: 'posts' },
      { action: 'like', resource: 'comments' }
    ]
  }
];