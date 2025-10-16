import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Plus, Calendar, FileText, Eye } from 'lucide-react';
import { Table } from '../components/Table.jsx';
import { Badge } from '../components/Badge.jsx';
import { NoRecordsFound } from '../components/EmptyState.jsx';
import { TextInput } from '../components/TextInput.jsx';
import { Select } from '../components/Select.jsx';
import { apiClient } from '../lib/apiClient.js';

export function Registros() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del backend
  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoading(true);
        console.log('🔄 Cargando registros desde el backend...');

        // Obtener pacientes, episodios y diagnósticos
        const [pacientes, episodios, diagnosticos] = await Promise.all([
          apiClient.getPacientes(),
          apiClient.getEpisodios(),
          apiClient.getDiagnosticos()
        ]);

        console.log('📊 Datos obtenidos:', { pacientes, episodios, diagnosticos });

        // Combinar los datos para crear registros completos
        const combinedRecords = episodios.map(episodio => {
          const paciente = pacientes.find(p => p.id_paciente === episodio.id_paciente);
          const diagnostico = diagnosticos.find(d => d.id_episodio === episodio.id_episodio);

          return {
            id: episodio.id_episodio,
            date: episodio.fecha_adm,
            episode: `EP-${episodio.id_episodio}`,
            patient: paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente no encontrado',
            professional: 'Dr. Sistema', // Por ahora hardcodeado
            diagnosis: diagnostico ? diagnostico.diagnostico : 'Diagnóstico pendiente',
            status: 'completed', // Por ahora todos completados
            result: 'applies', // Por ahora todos aplican
            insurance: paciente ? paciente.aseguradora : 'N/A',
            rut: paciente ? paciente.rut : 'N/A',
            age: paciente && paciente.fecha_nacimiento ?
              Math.floor((new Date() - new Date(paciente.fecha_nacimiento)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A',
            paciente: paciente,
            episodio: episodio,
            diagnostico: diagnostico
          };
        });

        console.log('✅ Registros combinados:', combinedRecords);
        setRecords(combinedRecords);
      } catch (error) {
        console.error('❌ Error cargando registros:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'draft', label: 'Borrador' },
    { value: 'submitted', label: 'Enviado' },
    { value: 'evaluating', label: 'Evaluando' },
    { value: 'completed', label: 'Completado' },
  ];

  const columns = [
    {
      key: 'date',
      label: 'Fecha',
      render: (value) => new Date(value).toLocaleDateString('es-CL'),
    },
    {
      key: 'episode',
      label: 'Episodio',
    },
    {
      key: 'patient',
      label: 'Paciente',
    },
    {
      key: 'professional',
      label: 'Profesional',
    },
    {
      key: 'diagnosis',
      label: 'Diagnóstico',
    },
    {
      key: 'status',
      label: 'Estado',
      render: (value) => {
        switch (value) {
          case 'completed':
            return <Badge variant="success">Completado</Badge>;
          case 'evaluating':
            return <Badge variant="warning">Evaluando</Badge>;
          case 'submitted':
            return <Badge variant="info">Enviado</Badge>;
          default:
            return <Badge>Borrador</Badge>;
        }
      },
    },
    {
      key: 'result',
      label: 'Resultado',
      render: (value) => {
        if (!value) return <span className="text-gray-400">-</span>;
        switch (value) {
          case 'applies':
            return <Badge variant="success">Aplica</Badge>;
          case 'not_applies':
            return <Badge variant="danger">No aplica</Badge>;
          case 'uncertain':
            return <Badge variant="warning">Incierto</Badge>;
          default:
            return <span className="text-gray-400">-</span>;
        }
      },
    },
    {
      key: 'insurance',
      label: 'Aseguradora',
    },
  ];

  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchQuery ||
      record.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.episode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    // Mock CSV export
    const csvData = filteredRecords.map(record => [
      record.date,
      record.episode,
      record.patient,
      record.professional,
      record.diagnosis,
      record.status,
      record.result || '',
      record.insurance,
    ]);

    const csvContent = [
      ['Fecha', 'Episodio', 'Paciente', 'Profesional', 'Diagnóstico', 'Estado', 'Resultado', 'Aseguradora'],
      ...csvData,
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registros_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Registros</h1>
          <p className="mt-2 text-gray-600">
            Historial de episodios médicos registrados
          </p>
        </div>

        <Link to="/registros/nuevo" className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Registro
        </Link>
      </div>

      {/* Filters and search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <TextInput
                placeholder="Buscar por paciente, episodio o diagnóstico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-search
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

          <button
            onClick={handleExport}
            className="btn btn-outline"
            disabled={filteredRecords.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="card">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">Cargando registros...</span>
              </div>
            </div>
          ) : error ? (
            <div className="card">
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Error al cargar los registros: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="card p-0">
              <Table
                columns={columns}
                data={filteredRecords}
                pagination={true}
                pageSize={10}
                onRowClick={(record) => setSelectedRecord(record)}
              />
            </div>
          ) : (
            <div className="card">
              <NoRecordsFound
                searchQuery={searchQuery}
                onClear={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                }}
                onCreate={() => window.location.href = '/registros/nuevo'}
              />
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Detalle del Registro
          </h3>

          {selectedRecord ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Información del Paciente</h4>
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="text-gray-500">Nombre:</dt>
                    <dd className="font-medium">{selectedRecord.patient}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">RUT:</dt>
                    <dd>{selectedRecord.rut}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Edad:</dt>
                    <dd>{selectedRecord.age} años</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Información del Episodio</h4>
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="text-gray-500">Episodio:</dt>
                    <dd className="font-medium">{selectedRecord.episode}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Fecha:</dt>
                    <dd>{new Date(selectedRecord.date).toLocaleDateString('es-CL')}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Profesional:</dt>
                    <dd>{selectedRecord.professional}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Diagnóstico:</dt>
                    <dd>{selectedRecord.diagnosis}</dd>
                  </div>
                </dl>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Link
                  to={`/evaluacion/resultado/${selectedRecord.id}`}
                  className="btn btn-primary w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver detalles completos
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Seleccione un registro para ver los detalles
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
