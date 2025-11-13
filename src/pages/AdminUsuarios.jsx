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
    { value: 'rejected', label: 'Rechazados' },
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
          case 'rejected':
            return <Badge variant="danger">Rechazado</Badge>;
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

  const pendingUsers = solicitudes.filter(s => s.estado === 'pendiente');
  const activeUsers = users.filter(user => user.is_active || user.status === 'active');

  // Resolve a solicitud id from different kinds of inputs (handles backend keys id_solicitud / id_usuario)
  const resolveSolicitudId = (input) => {
    if (input == null) return null;

    // If a number was passed: it could be a solicitud.id_solicitud OR a usuario.id
    if (typeof input === 'number') {
      // If there's a solicitud with this id_solicitud, return it
      const bySolicitudId = solicitudes.find((s) => s.id_solicitud === input);
      if (bySolicitudId) return bySolicitudId.id_solicitud;

      // otherwise try match by id_usuario
      const byUsuarioId = solicitudes.find((s) => s.id_usuario === input || (s.usuario && s.usuario.id === input));
      if (byUsuarioId) return byUsuarioId.id_solicitud;

      return null;
    }

    // If an object was passed, it could be a solicitud object or a user-like object
    // If it's a solicitud object (has id_solicitud), prefer matching by it
    if (input && input.id_solicitud) {
      const maybeSolicitud = solicitudes.find((s) => s.id_solicitud === input.id_solicitud);
      if (maybeSolicitud) return maybeSolicitud.id_solicitud;
    }

    // Try match by id_usuario inside solicitudes (e.g., selectedUser.id -> match s.id_usuario)
    if (input && input.id) {
      const byUsuario = solicitudes.find((s) => s.id_usuario === input.id || (s.usuario && s.usuario.id === input.id));
      if (byUsuario) return byUsuario.id_solicitud;
    }

    // Try match by email (if present)
    if (input && input.email) {
      const byEmail = solicitudes.find((s) => (s.email && s.email === input.email) || (s.usuario && s.usuario.email === input.email));
      if (byEmail) return byEmail.id_solicitud;
    }

    return null;
  };

  const handleApproveUser = async (solicitudId) => {
    try {
      // LOG: mostrar input y ruta que vamos a llamar
      console.log('[AdminUsuarios] handleApproveUser called with:', { solicitudId, solicitudesCount: solicitudes.length });
      const route = `${apiClient.baseURL}/solicitudes/${solicitudId}/aceptar`;
      console.log('[AdminUsuarios] Will call POST', route);


      if (!solicitudId) {
        console.log('[AdminUsuarios] No solicitudId resolved; solicitudes array (first 3):', solicitudes.slice(0,3));
        alert('No se pudo determinar la solicitud a aprobar');
        return;
      }

      const res = await apiClient.request(`/solicitudes/${solicitudId}/aceptar`, { method: 'POST' });
      console.log('[AdminUsuarios] Approve response:', res);

      // refrescar usuarios y contadores
      await refreshData();

      // si estaba seleccionado como selectedUser, limpiarlo
      setSelectedUser((prev) => (prev && prev.solicitud_id === solicitudId ? null : prev));

      alert('Solicitud aceptada y usuario activado exitosamente');
    } catch (error) {
      console.error('[AdminUsuarios] Error approving solicitud:', error);
      if (error && error.status === 422) {
        alert('No se pudo aceptar la solicitud: el servidor rechazó la operación (estado no válido). Revisa la consola Network/Response para detalles.');
      } else {
        alert(error.message || 'Error aceptando la solicitud (revisa la consola para más detalles)');
      }
    }
  };

  const handleRejectUser = async (solicitudId) => {
    const confirmed = confirm('¿Está seguro de que desea rechazar esta solicitud?');
    if (!confirmed) return;

    try {
      console.log('[AdminUsuarios] handleRejectUser called with:', { solicitudId, solicitudesCount: solicitudes.length });
      const route = `${apiClient.baseURL}/solicitudes/${solicitudId}/rechazar`;
      console.log('[AdminUsuarios] Will call POST', route);
      // alert(`DEBUG: POST ${route}`);

      if (!solicitudId) {
        console.log('[AdminUsuarios] No solicitudId resolved; solicitudes array (first 3):', solicitudes.slice(0,3));
        alert('No se pudo determinar la solicitud a rechazar');
        return;
      }

      const res = await apiClient.request(`/solicitudes/${solicitudId}/rechazar`, { method: 'POST' });
      console.log('[AdminUsuarios] Reject response:', res);

      // refrescar usuarios y contadores
      await refreshData();

      setSelectedUser((prev) => (prev && prev.solicitud_id === solicitudId ? null : prev));
      alert('Solicitud rechazada exitosamente');
    } catch (error) {
      console.error('[AdminUsuarios] Error rejecting solicitud:', error);
      if (error && error.status === 422) {
        alert('No se pudo rechazar la solicitud: el servidor devolvió estado no procesable. Revisa la consola Network/Response para más info.');
      } else {
        alert(error.message || 'Error rechazando la solicitud (revisa la consola para más detalles)');
      }
    }
  };

  const handleToggleUserActive = async (user) => {
    try {
      const isActive = user.is_active || user.status === 'active';

      const endpoint = isActive
        ? `/usuarios/${user.id}/deshabilitar`
        : `/usuarios/${user.id}/activar`;

      await apiClient.request(endpoint, { method: 'POST' });

      // Recargamos todo para refrescar estados/badges
      await refreshData();
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      alert('Ocurrió un error al cambiar el estado del usuario.');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.request('/usuarios');
      const usuarios = Array.isArray(res) ? res : [];

      const usuariosConEstado = usuarios.map((u) => {
        // Buscamos una solicitud asociada a este usuario (si existe)
        const solicitud = solicitudes.find((s) => s.id_usuario === u.id_usuario);

        let status;

        if (u.is_active) {
          status = 'active';
        } else if (solicitud?.estado === 'rechazada') {
          status = 'rejected';
        } else if (solicitud?.estado === 'pendiente') {
          status = 'pending';
        } else {
          // Usuario inactivo sin solicitud (o sin info)
          status = 'disabled';
        }

        return {
          // mantenemos también los campos originales por si los necesitas
          ...u,
          id: u.id_usuario,
          firstName: u.nombre,
          lastName: u.apellido,
          email: u.email,
          role: u.rol,
          department: u.servicio || '',
          status,
          registrationDate:
            solicitud?.fecha_registro || solicitud?.fecha_solicitud || null,
          casesProcessed: u.casos_procesados || 0,
        };
      });

      setUsers(usuariosConEstado);
      setTotalUsers(usuariosConEstado.length);
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
      // Debug: muestra una muestra del payload para inspeccionar forma/keys
      console.log('[AdminUsuarios] fetchSolicitudes payload sample:', Array.isArray(res) ? res.slice(0,5) : res);
    } catch (error) {
      if (error && error.status === 422) {
        console.error('Solicitudes endpoint returned 422. Response:', error.message || error);
      } else {
        console.error('Error fetching solicitudes:', error);
      }
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);

      // 1) Primero traemos solicitudes
      const solicitudesRes = await apiClient.request('/solicitudes');
      const solicitudesArr = Array.isArray(solicitudesRes) ? solicitudesRes : [];
      setSolicitudes(solicitudesArr);

      // 2) Luego traemos usuarios (que ahora sí puede usar `solicitudes` del estado)
      const usuariosRes = await apiClient.request('/usuarios');
      const usuarios = Array.isArray(usuariosRes) ? usuariosRes : [];

      const usuariosConEstado = usuarios.map((u) => {
        const solicitud = solicitudesArr.find((s) => s.id_usuario === u.id_usuario);

        let status;
        if (u.is_active) {
          status = 'active';
        } else if (solicitud?.estado === 'rechazada') {
          status = 'rejected';
        } else if (solicitud?.estado === 'pendiente') {
          status = 'pending';
        } else {
          status = 'disabled';
        }

        return {
          ...u,
          id: u.id_usuario,
          firstName: u.nombre,
          lastName: u.apellido,
          email: u.email,
          role: u.rol,
          department: u.servicio || '',
          status,
          registrationDate:
            solicitud?.fecha_registro || solicitud?.fecha_solicitud || null,
          casesProcessed: u.casos_procesados || 0,
        };
      });

      setUsers(usuariosConEstado);
      setTotalUsers(usuariosConEstado.length);

      // 3) y finalmente el contador de activos
      const activosRes = await apiClient.request('/usuarios/activos');
      setActiveUsersCount(
        Array.isArray(activosRes) ? activosRes.length : (activosRes && activosRes.count) || 0
      );
    } catch (error) {
      console.error('Error en refreshData:', error);
    } finally {
      setLoading(false);
    }
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
                {users.reduce((sum, user) => sum + (Number(user.casesProcessed) || 0), 0)}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Pending users section */}
      {pendingUsers.length > 0 && (
        <div className="card mb-6 border border-gray-200 shadow-sm">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Usuarios pendientes de aprobación
                </h3>
                <p className="text-lg text-gray-500">
                  Revisa las solicitudes recientes y acepta o rechaza el acceso.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-lg font-medium bg-gray-200 text-gray-700">
              {pendingUsers.length} pendiente{pendingUsers.length !== 1 && 's'}
            </span>
          </div>

          {/* Lista scrolleable */}
          <div className="max-h-80 overflow-y-auto">
            {pendingUsers.map((solicitud) => (
              <div
                key={solicitud.id_solicitud}
                className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                {/* Info usuario */}
                <div className="flex flex-col">
                  
                  {/* Email + Nombre en grande */}
                  <button
                    type="button"
                    onClick={() => {
                      const user = users.find(
                        (u) =>
                          u.id_usuario === solicitud.id_usuario ||
                          u.id === solicitud.id_usuario
                      );
                      if (user) setSelectedUser(user);
                    }}
                    className="text-lg font-semibold text-blue-700 hover:underline text-left"
                  >
                    {solicitud.usuario?.email || 'sin email'}
                  </button>

                  <div className="text-lg font-medium text-gray-800 leading-tight">
                    {solicitud.usuario
                      ? `${solicitud.usuario.nombre ?? ''} ${solicitud.usuario.apellido ?? ''}`
                      : '—'}
                  </div>

                  {/* Rol */}
                  <div className="text-lg text-gray-600 mt-0.5">
                    {solicitud.usuario?.rol === 'doctor'
                      ? 'Médico'
                      : solicitud.usuario?.rol === 'nurse'
                      ? 'Enfermero/a'
                      : solicitud.usuario?.rol || 'Sin rol'}
                  </div>

                  {/* Fecha */}
                  <div className="text-xs text-gray-400 mt-1">
                    Registrado:{' '}
                    {solicitud.fecha_solicitud
                      ? new Date(solicitud.fecha_solicitud).toLocaleDateString('es-CL')
                      : '—'}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-5 text-sm">
                  <button
                    onClick={() => handleApproveUser(solicitud.id_solicitud)}
                    className="inline-flex items-center text-green-700 hover:text-green-800"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Aprobar
                  </button>

                  <button
                    onClick={() => handleRejectUser(solicitud.id_solicitud)}
                    className="inline-flex items-center text-red-600 hover:text-red-700"
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
                  onClick={() => {
                    const resolved = resolveSolicitudId(selectedUser);
                    console.log('[AdminUsuarios] Approve from panel resolvedSolicitudId:', resolved, 'selectedUser:', selectedUser);
                    if (!resolved) {
                      alert('No se encontró solicitud para este usuario. Por favor aprueba desde la lista de pendientes o revisa la consola.');
                      console.log('[AdminUsuarios] solicitudes sample:', solicitudes.slice(0,5));
                      return;
                    }
                    handleApproveUser(resolved);
                  }}
                  className="btn btn-primary"
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Aprobar Usuario
                </button>
                <button
                  onClick={() => {
                    const resolved = resolveSolicitudId(selectedUser);
                    console.log('[AdminUsuarios] Reject from panel resolvedSolicitudId:', resolved, 'selectedUser:', selectedUser);
                    if (!resolved) {
                      alert('No se encontró solicitud para este usuario. Por favor rechaza desde la lista de pendientes o revisa la consola.');
                      console.log('[AdminUsuarios] solicitudes sample:', solicitudes.slice(0,5));
                      return;
                    }
                    handleRejectUser(resolved);
                  }}
                  className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Rechazar Usuario
                </button>
              </>
            )}
            {/* Botones para usuarios NO pendientes: activar/deshabilitar */}
            {selectedUser.status !== 'pending' && (
              <>
                <button
                  onClick={() => handleToggleUserActive(selectedUser)}
                  className={
                    (selectedUser.is_active || selectedUser.status === 'active')
                      ? "btn btn-outline text-red-600 border-red-300 hover:bg-red-50"
                      : "btn btn-primary"
                  }
                >
                  {selectedUser.is_active || selectedUser.status === 'active' ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Deshabilitar Usuario
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activar Usuario
                    </>
                  )}
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