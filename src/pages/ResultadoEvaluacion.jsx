import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronDown, 
  ArrowRight, 
  Printer,
  Download,
  Loader2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient.js';
import { jwtDecode } from "jwt-decode";


export function ResultadoEvaluacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [diagnostico, setDiagnostico] = useState(null);
  const [observacion, setObservacion] = useState(null);
  const [pertinencia_medico, setPertinenciaMedico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluacionMedica, setEvaluacionMedica] = useState(null);

  const [userId, setUserId] = useState(null);

    useEffect(() => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUserId(decoded.sub); // ✅ usar 'sub' en lugar de 'id_usuario'
          console.log("ID del usuario:", decoded.sub);
        } catch (error) {
          console.error("Error decodificando token:", error);
        }
      }

      const fetchEvaluationAndPaciente = async () => {
        setLoading(true);
        setError(null);
        try {
          // 1️⃣ Obtener evaluación IA
          const evaluacionIA = await apiClient.getEvaluacionIA(id);
          setEvaluation(evaluacionIA);

          // 2️⃣ Obtener paciente asociado al episodio
          if (evaluacionIA?.id_episodio) {
            const pacienteData = await apiClient.getPacientePorEpisodio(evaluacionIA.id_episodio);
            setPaciente(pacienteData);

            // Verificar si ya existe una evaluación médica
            try {
              const registros = await apiClient.getRegistros();
              const registro = registros.find(r => r.id === evaluacionIA.id_episodio);
              if (registro?.id_eval_medica) {
                const evaluacionMedicaExistente = await apiClient.getEvaluacionLeyUrgencia(registro.id_eval_medica);
                setEvaluacionMedica(evaluacionMedicaExistente);
              }
            } catch (err) {
              console.warn('No se pudo obtener evaluación médica:', err);
            }
          }

          // 3️⃣ Obtener diagnóstico asociado a la evaluación
          if (evaluacionIA?.id_diagnostico) {
            const diagnosticoData = await apiClient.getDiagnostico(evaluacionIA.id_diagnostico);
            setDiagnostico(diagnosticoData);
            console.log(diagnosticoData)
          }
        } catch (error) {
          console.error('Error al obtener evaluación o paciente:', error);
          setError(error.message || 'Error al cargar la evaluación');
        } finally {
          setLoading(false);
        }
      };

      fetchEvaluationAndPaciente();
    }, [id]);

  // --- Funciones auxiliares ---
  const getResultIcon = (pertinencia) => {
    if (pertinencia === true) {
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    } else if (pertinencia === false) {
      return <XCircle className="w-8 h-8 text-red-500" />;
    } else {
      return <AlertCircle className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getResultText = (pertinencia) => {
    if (pertinencia === true) {
      return 'Aplica para Activación de Ley';
    } else if (pertinencia === false) {
      return 'No Aplica para Activación de Ley';
    } else {
      return 'Resultado Incierto - Revisión Manual Requerida';
    }
  };

  const getResultColor = (pertinencia) => {
    if (pertinencia === true) {
      return 'bg-green-50 border-green-200 text-green-800';
    } else if (pertinencia === false) {
      return 'bg-red-50 border-red-200 text-red-800';
    } else {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };


  const getWeightBadge = (weight) => {
    const colors = {
      'Crítico': 'bg-red-100 text-red-800',
      'Alto': 'bg-orange-100 text-orange-800',
      'Medio': 'bg-yellow-100 text-yellow-800',
      'Bajo': 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[weight] || colors['Bajo']}`}>
        {weight}
      </span>
    );
  };

  const handleExportPDF = () => console.log('Exportando PDF del resultado de evaluación');

  const handlePrint = () => {
    window.print();
  };

  const handleAccept = () => {
    navigate(`/evaluacion/cierre/${id}`);
  };

  const handleReject = () => {
    navigate(`/evaluacion/cierre/${id}?action=reject`);
  };

  const handleGuardarEvaluacion = async () => {
    if (pertinencia_medico === null) {
      alert("Debe seleccionar una opción antes de guardar.");
      return;
    }

    // Validar que tenemos todos los datos necesarios
    if (!evaluation?.id_episodio) {
      alert("Error: No se encontró el ID del episodio. Por favor, recargue la página.");
      return;
    }

    if (!evaluation?.id_eval_ia) {
      alert("Error: No se encontró el ID de la evaluación IA. Por favor, recargue la página.");
      return;
    }

    if (!userId) {
      alert("Error: No se encontró el ID del usuario. Por favor, inicie sesión nuevamente.");
      return;
    }

    const payload = {
      id_episodio: evaluation.id_episodio,
      id_eval_ia: evaluation.id_eval_ia,
      id_medico: userId,
      pertinencia_medico: pertinencia_medico,
      observaciones: observacion || null,
      estado_aseguradora: evaluation.estado_aseguradora || null,
      sugerencia_ia: evaluation.pertinencia_ia || null,
    };

    console.log("📤 Enviando evaluación médica:", payload);
    console.log("📋 Datos de evaluación disponibles:", {
      id_episodio: evaluation.id_episodio,
      id_eval_ia: evaluation.id_eval_ia,
      userId: userId,
      pertinencia_ia: evaluation.pertinencia_ia,
    });

    try {
      const respuesta = await apiClient.createEvaluacionLeyUrgencia(payload);
      console.log("✅ Evaluación guardada:", respuesta);
      alert("Evaluación guardada correctamente.");
      navigate(`/`)
    } catch (error) {
      console.error("❌ Error al guardar la evaluación:", error);
      console.error("📋 Payload enviado:", payload);
      console.error("🔍 Detalles del error:", {
        status: error.status,
        message: error.message,
      });
      
      // Mostrar mensaje de error más descriptivo
      const errorMessage = error.message || 'Error desconocido';
      alert(`Error al guardar la evaluación: ${errorMessage}\n\nPor favor, verifique que todos los datos sean correctos e intente nuevamente.`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Cargando evaluación...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-800">Error: {error || 'No se pudo cargar la evaluación'}</p>
        </div>
      </div>
    );
  }

  // Si ya existe una evaluación médica, no mostrar los botones de aceptar/rechazar
  const yaProcesada = evaluacionMedica !== null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:max-w-none">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resultado de Evaluación</h1>
          <p className="mt-2 text-gray-600">
            Evaluación automática mediante Inteligencia Artificial
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="btn btn-outline">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </button>
          <button onClick={handleExportPDF} className="btn btn-outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Patient and episode info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información del paciente */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Paciente</h2>
          {paciente ? (
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="text-sm text-gray-900">{paciente.nombre} {paciente.apellido}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">RUT</dt>
                <dd className="text-sm text-gray-900">{paciente.rut}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sexo</dt>
                  <dd className="text-sm text-gray-900">{paciente.sexo}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Aseguradora</dt>
                  <dd className="text-sm text-gray-900">{paciente.aseguradora}</dd>
                </div>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500 italic">Cargando información del paciente...</p>
          )}
        </div>

        {/* Información del episodio */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Episodio</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Centro</dt>
              <dd className="text-sm text-gray-900">{evaluation.centro || 'No especificado'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de admisión</dt>
              <dd className="text-sm text-gray-900">{evaluation.fecha_adm ? new Date(evaluation.fecha_adm).toLocaleDateString('es-CL') : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="text-sm text-gray-900">{evaluation.estado || 'Pendiente'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 🔹 Información del Diagnóstico */}
      {diagnostico && (
        <div className="card bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pl-4 pt-4">Información del Diagnóstico</h2>
          <dl className="space-y-2 text-sm text-gray-800 pl-4 pb-4 pr-4">
            <div>
              <dt className="font-medium text-gray-500">Diagnóstico</dt>
              <dd>{diagnostico.diagnostico}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Motivo de consulta</dt>
              <dd>{diagnostico.motivo_consulta}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Condición clínica</dt>
              <dd>{diagnostico.condicion_clinica}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Anamnesis</dt>
              <dd>{diagnostico.anamnesis}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Triage</dt>
              <dd>{diagnostico.triage}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-500">Signos Vitales</dt>
              <dd>{diagnostico.signos_vitales}</dd>
            </div>
            {diagnostico.examenes && diagnostico.examenes.trim() !== "" && (
              <div>
                <dt className="font-medium text-gray-500">Exámenes</dt>
                <dd>{diagnostico.examenes}</dd>
              </div>
            )}

            {diagnostico.laboratorios && diagnostico.laboratorios.trim() !== "" && (
              <div>
                <dt className="font-medium text-gray-500">Laboratorios</dt>
                <dd>{diagnostico.laboratorios}</dd>
              </div>
            )}

            {diagnostico.imagenes && diagnostico.imagenes.trim() !== "" && (
              <div>
                <dt className="font-medium text-gray-500">Imágenes</dt>
                <dd>{diagnostico.imagenes}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Resultado de IA */}
      <div className={`card ${getResultColor(evaluation.pertinencia_ia)} mb-24`}>
        <div className="flex items-center gap-4 mb-4 pl-4">
          {getResultIcon(evaluation.pertinencia_ia)}
          <div className="flex-1">
            <h2 className="text-xl font-semibold pt-4">
              {getResultText(evaluation.pertinencia_ia)}
            </h2>
            <p className="text-sm opacity-90 mt-1">
              Nivel de confianza: {evaluation.confianza}%
            </p>
          </div>
        </div>

        {/* Recomendación del Sistema */}
        <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4 mx-6">
          <h3 className="font-medium mb-2">Recomendación del Sistema</h3>
          <p className="text-sm text-gray-800">{evaluation.justificacion}</p>

        </div>

        {/* Criterios aplicados */}
        {evaluation.criterios && (
          <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4 mx-6">
            <h3 className="font-medium mb-2">Criterios Aplicados</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
              {(() => {
                let criterios = [];

                try {
                  // Si es string JSON, lo parseamos
                  criterios = typeof evaluation.criterios === "string"
                    ? JSON.parse(evaluation.criterios)
                    : evaluation.criterios;
                } catch (e) {
                  console.error("Error al parsear criterios:", e);
                }

                // Validamos que sea un array antes de mapear
                return Array.isArray(criterios)
                  ? criterios.map((criterio, index) => (
                      <li key={index}>{criterio}</li>
                    ))
                  : <li>No hay criterios disponibles.</li>;
              })()}
            </ul>
          </div>
        )}

        {/* Fuentes utilizadas */}
        {evaluation.fuentes_utilizadas && (
          <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4 mx-6">
            <h3 className="font-medium mb-2">Fuentes Utilizadas</h3>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
              {(() => {
                let fuentes = [];

                try {
                  // Parsear si viene como string
                  fuentes = typeof evaluation.fuentes_utilizadas === "string"
                    ? JSON.parse(evaluation.fuentes_utilizadas)
                    : evaluation.fuentes_utilizadas;
                } catch (e) {
                  console.error("Error al parsear fuentes:", e);
                }

                return Array.isArray(fuentes) && fuentes.length > 0 ? (
                  fuentes.map((fuente, index) => (
                    <li key={index}>
                      <p className="font-semibold">{fuente.documento}</p>
                      <p className="text-gray-700">{fuente.cita}</p>
                    </li>
                  ))
                ) : (
                  <li>No se registraron fuentes utilizadas.</li>
                );
              })()}
            </ul>
          </div>
        )}

        {/* Modelo de IA */}
        {evaluation.modelo && (
          <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-6 mx-6">
            <h3 className="font-medium mb-2">Modelo de IA Utilizado</h3>
            <p className="text-sm text-gray-800">{evaluation.modelo}</p>
          </div>
        )}
      </div>
      

    {/* Acciones */}
    <div className="card print:hidden space-y-4">
      {/* Disclaimer */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <p className="text-sm text-yellow-800">
          ⚠️ A pesar de la recomendación de la IA, el médico <strong>debe evaluar y determinar si el caso aplica o no a la Ley de Urgencias</strong>. 
          Puede dejar una observación opcional sobre los criterios personales utilizados para tomar su decisión.
        </p>
      </div>

      {/* Selección de decisión */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Selección de Evaluación
        </label>
        <select
          className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          value={pertinencia_medico === null ? "" : pertinencia_medico ? "true" : "false"}
          onChange={(e) => {
            const value = e.target.value;
            setPertinenciaMedico(value === "true"); // convierte string a boolean
          }}
        >
          <option value="">-- Seleccione una opción --</option>
          <option value="true">Caso pertinente a Ley de Urgencias</option>
          <option value="false">Caso NO pertinente a Ley de Urgencias</option>
        </select>
      </div>


      {/* Campo de observación opcional */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observación del médico (opcional)
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          placeholder="Ingrese sus criterios o comentarios aquí..."
          rows={3}
          value={observacion}   // necesitarás un useState para manejar esto
          onChange={(e) => setObservacion(e.target.value)}
        />
      </div>

      {/* Botón único para guardar */}
      <div className="mt-4">
        <button
          onClick={handleGuardarEvaluacion}
          disabled={pertinencia_medico === null} // 🔹 deshabilitado si no hay selección
          className={`flex justify-center items-center px-4 py-2 text-white font-semibold rounded-md w-full
            ${pertinencia_medico === null 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-[#a867ab] hover:bg-[#7c308a]'
            }`}
        >
          Guardar Evaluación Ley de Urgencias
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>


    </div>


    </div>
  );
}
