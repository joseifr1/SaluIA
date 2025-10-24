import React, { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Mail, MoreVertical, Shield, Clock, CheckCircle } from 'lucide-react';
import { Table } from '../components/Table.jsx';
import { Badge } from '../components/Badge.jsx';
import { TextInput } from '../components/TextInput.jsx';
import { Select } from '../components/Select.jsx';
import { apiClient } from '../lib/apiClient.js';

export function AdminUsuarios() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Remote data
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'active', label: 'Activos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'disabled', label: 'Deshabilitados' },
  ];

  const roleOptions = [
    { value: '', label: 'Todos los roles' },
    { value: 'admin', label: 'Administrador' },
    { value: 'doctor', label: 'Médico' },
    { value: 'nurse', label: 'Enfermero/a' },
  ];

  const columns = [
    {
      key: 'name',
      label: 'Usuario',
      render: (_, user) => (
        <div>
          <div className="font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Rol',
      render: (value) => {
        const roleLabels = {
          admin: 'Administrador',
          doctor: 'Médico',
          nurse: 'Enfermero/a',
        };
        return roleLabels[value] || value;
      },
    },
    {
      key: 'department',
      label: 'Servicio',
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value) => {
        switch (value) {
          case 'active':
            return <Badge variant="success">Activo</Badge>;
          case 'pending':
            return <Badge variant="warning">Pendiente</Badge>;
          case 'disabled':
            return <Badge variant="danger">Deshabilitado</Badge>;
          default:
            return <Badge>Desconocido</Badge>;
        }
      },
    },
    {
      key: 'registrationDate',
      label: 'Registro',
      render: (value) => new Date(value).toLocaleDateString('es-CL'),
    },
    {
      key: 'lastLogin',
      label: 'Último acceso',
      render: (value) => value ? new Date(value).toLocaleDateString('es-CL') : 'Nunca',
    },
    {
      key: 'casesProcessed',
      label: 'Casos',
      render: (value) => value || 0,
    },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingUsers = solicitudes; // list shown in Pending section comes from solicitudes endpoint
  const activeUsers = users.filter(user => user.is_active || user.status === 'active');

  const handleApproveUser = async (userId) => {
    try {
      await apiClient.request(`/solicitudes/${userId}/aceptar`, { method: 'POST' });
      alert('Solicitud aceptada y usuario activado exitosamente');
      await refreshData();
    } catch (error) {
      alert(error.message || 'Error aceptando la solicitud');
    }
  };

  const handleRejectUser = async (userId) => {
    const confirmed = confirm('¿Está seguro de que desea rechazar esta solicitud?');
    if (!confirmed) return;
    try {
      await apiClient.request(`/solicitudes/${userId}/rechazar`, { method: 'POST' });
      alert('Solicitud rechazada exitosamente');
      await refreshData();
    } catch (error) {
      alert(error.message || 'Error rechazando la solicitud');
    }
  };

  const handleDisableUser = async (userId) => {
    const confirmed = confirm('¿Está seguro de que desea deshabilitar este usuario?');
    if (confirmed) {
      console.log('Deshabilitando usuario:', userId);
      alert(`Usuario deshabilitado`);
    }
  };

  const handleReinviteUser = async (userId) => {
    console.log('Reenviando invitación:', userId);
    alert(`Invitación reenviada exitosamente`);
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.request('/usuarios');
      // assume res is an array of users
      setUsers(res || []);
      setTotalUsers(Array.isArray(res) ? res.length : 0);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const res = await apiClient.request('/usuarios/activos');
      // assume res is array of active users
      setActiveUsersCount(Array.isArray(res) ? res.length : (res && res.count) || 0);
    } catch (error) {
      console.error('Error fetching active users:', error);
    }
  };

  const fetchSolicitudes = async () => {
    try {
      const res = await apiClient.request('/solicitudes');
      setSolicitudes(Array.isArray(res) ? res : []);
    } catch (error) {
      if (error && error.status === 422) {
        console.error('Solicitudes endpoint returned 422. Response:', error.message || error);
      } else {
        console.error('Error fetching solicitudes:', error);
      }
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchActiveUsers(), fetchSolicitudes()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="mt-2 text-gray-600">
          Administre usuarios del sistema y controle el acceso
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
            </div>
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-semibold text-green-600">{activeUsers.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-semibold text-yellow-600">{pendingUsers.length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Casos Procesados</p>
              <p className="text-2xl font-semibold text-blue-600">
                {users.reduce((sum, user) => sum + user.casesProcessed, 0)}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Pending users section */}
      {pendingUsers.length > 0 && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-yellow-900">
              Usuarios Pendientes de Aprobación ({pendingUsers.length})
            </h2>
          </div>
          
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-white rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user.email} • {user.department} • {user.role === 'doctor' ? 'Médico' : 'Enfermero/a'}
                  </div>
                  <div className="text-xs text-gray-400">
                    Registrado: {new Date(user.registrationDate).toLocaleDateString('es-CL')}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveUser(user.id)}
                    className="btn btn-primary"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleRejectUser(user.id)}
                    className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <TextInput
                placeholder="Buscar por nombre, email o servicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Filtrar por estado"
            />
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="card p-0">
        <Table
          columns={columns}
          data={filteredUsers}
          pagination={true}
          pageSize={10}
          onRowClick={setSelectedUser}
        />
      </div>

      {/* User actions panel */}
      {selectedUser && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones para {selectedUser.firstName} {selectedUser.lastName}
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {selectedUser.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApproveUser(selectedUser.id)}
                  className="btn btn-primary"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Aprobar Usuario
                </button>
                <button
                  onClick={() => handleRejectUser(selectedUser.id)}
                  className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Rechazar Usuario
                </button>
              </>
            )}
            
            {selectedUser.status === 'active' && (
              <>
                <button
                  onClick={() => handleDisableUser(selectedUser.id)}
                  className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Deshabilitar Usuario
                </button>
                <button
                  onClick={() => handleReinviteUser(selectedUser.id)}
                  className="btn btn-outline"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Reinvitar Usuario
                </button>
              </>
            )}
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Información del Usuario</h4>
              <dl className="space-y-1">
                <div>
                  <dt className="text-gray-500">Email:</dt>
                  <dd>{selectedUser.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Rol:</dt>
                  <dd>{selectedUser.role === 'doctor' ? 'Médico' : 'Enfermero/a'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Servicio:</dt>
                  <dd>{selectedUser.department}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Estadísticas</h4>
              <dl className="space-y-1">
                <div>
                  <dt className="text-gray-500">Registro:</dt>
                  <dd>{new Date(selectedUser.registrationDate).toLocaleDateString('es-CL')}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Último acceso:</dt>
                  <dd>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString('es-CL') : 'Nunca'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Casos procesados:</dt>
                  <dd>{selectedUser.casesProcessed}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}