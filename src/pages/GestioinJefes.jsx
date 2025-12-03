import React, { useEffect, useState } from 'react';
import { UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/apiClient.js';

export function GestioinJefes() {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // selection
  const [selectedChief, setSelectedChief] = useState(null); // single doctor
  const [teamMembers, setTeamMembers] = useState([]); // ids

  // shift details
  const [datetime, setDatetime] = useState(''); // datetime-local
  const [durationHours, setDurationHours] = useState(8);
  const [reminder, setReminder] = useState('');

  const refreshData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.request('/usuarios');
      const usuarios = Array.isArray(res) ? res : [];

      const mapped = usuarios.map((u) => ({
        ...u,
        id: u.id_usuario,
        firstName: u.nombre,
        lastName: u.apellido,
        email: u.email,
        role: u.rol || u.role,
        department: u.servicio || u.department || '',
      }));

      setUsers(mapped);
      setDoctors(mapped.filter((u) => (u.rol === 'doctor' || u.role === 'doctor')));
    } catch (error) {
      console.error('Error fetching usuarios for GestioinJefes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const toggleTeamMember = (id) => {
    setTeamMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSaveShift = async () => {
    if (!selectedChief) {
      alert('Seleccione primero un jefe de turno (doctor).');
      return;
    }

    if (!datetime) {
      alert('Seleccione fecha y hora para el turno.');
      return;
    }

    const payload = {
      jefe_id: selectedChief.id,
      equipo_ids: teamMembers,
      inicio: new Date(datetime).toISOString(),
      duracion_horas: Number(durationHours) || 0,
    };

    console.log('[GestioinJefes] shift payload:', payload);

    try {
      // If you have a backend endpoint to create shifts, replace the following call accordingly.
      // Example: await apiClient.request('/turnos', { method: 'POST', body: payload });
      alert('Turno guardado (simulado). Revisa la consola para ver el payload.');
    } catch (error) {
      console.error('Error saving shift:', error);
      alert('Ocurrió un error al guardar el turno. Revisa la consola.');
    }
  };

  // available users to add to team (exclude admins and the selected chief)
  const availableTeamUsers = users.filter((u) => {
    const role = u.rol || u.role;
    const isAdmin = role === 'admin' || role === 'administrator';
    if (isAdmin) return false;
    if (!selectedChief) return true;
    return u.id !== selectedChief.id;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Jefes de Turno</h1>
          <p className="mt-2 text-gray-600">Asigna jefes de turno, su equipo y horarios.</p>
        </div>
        <div>
          <Link
            to="/admin/usuarios"
            className="inline-flex items-center px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100 border"
          >
            ← Volver atrás
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Doctors list - single select */}
        <div className="card col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Seleccione Jefe de Turno (doctor)</h3>
            <span className="text-sm text-red-600 font-semibold">Obligatorio</span>
          </div>
          <p className="text-sm text-gray-500 mb-3">El jefe de turno debe ser un médico. Seleccione exactamente 1 doctor aquí antes de asignar su equipo y horario.</p>
          {loading ? (
            <div>Cargando doctores...</div>
          ) : (
            <div className="space-y-2">
              {doctors.length === 0 && <div className="text-sm text-gray-500">No se encontraron doctores.</div>}
              {doctors.map((d) => (
                <label
                  key={d.id}
                  className={`flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 ${selectedChief && selectedChief.id === d.id ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
                >
                  <div className="text-left">
                    <div className="font-medium">{d.nombre || `${d.firstName} ${d.lastName}`}</div>
                    <div className="text-sm text-gray-500">{d.email}</div>
                  </div>

                  <input
                    type="radio"
                    name="chief"
                    checked={selectedChief && selectedChief.id === d.id}
                    onChange={() => {
                      setSelectedChief(d);
                      setTeamMembers([]);
                    }}
                    className="ml-3"
                  />
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Team selection and shift details (right, larger) */}
        <div className="card col-span-3 p-6">
          <h3 className="text-lg font-semibold mb-3">Equipo y horario</h3>

          {!selectedChief ? (
            <div className="text-sm text-gray-500 mb-4">Seleccione primero un jefe de turno a la izquierda.</div>
          ) : (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Jefe seleccionado</div>
              <div className="font-medium mb-2">{selectedChief.nombre || `${selectedChief.firstName} ${selectedChief.lastName}`}</div>
            </div>
          )}

          {/* Reordered: first Fecha/Duración/Recordatorio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-600">Fecha y hora inicio</label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Duración (horas)</label>
              <input
                type="number"
                min="1"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Recordatorio</label>
              <textarea
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                placeholder="Opcional"
                className="mt-1 w-full border rounded-md p-2 h-10"
              />
            </div>
          </div>

          {/* Luego la lista de usuarios, con mayor altura para mostrar más items */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Equipo del turno</h4>
            <div className="max-h-80 overflow-y-auto border rounded-md p-2">
              {availableTeamUsers.map((u) => (
                <label key={u.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">
                      {u.nombre || `${u.firstName} ${u.lastName}`}{' '}
                      <span className="ml-2 text-sm font-semibold uppercase text-blue-600">→ {(u.rol || u.role || '').toString().toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={teamMembers.includes(u.id)}
                    onChange={() => toggleTeamMember(u.id)}
                    className="ml-3"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSaveShift} className="btn btn-primary inline-flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Guardar Turno
            </button>
            <button
              onClick={() => {
                setSelectedChief(null);
                setTeamMembers([]);
                setDatetime('');
                setDurationHours(8);
                setReminder('');
              }}
              className="btn btn-outline"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestioinJefes;
