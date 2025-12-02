import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Download, Plus, Calendar, FileText, Eye, Loader2, ArrowRight, Check } from 'lucide-react';
import { Table } from '../components/Table.jsx';
import { Badge } from '../components/Badge.jsx';
import { NoRecordsFound } from '../components/EmptyState.jsx';
import { apiClient } from '../lib/apiClient.js';
import { jwtDecode } from 'jwt-decode';

export function Registros() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para información de evaluación del registro seleccionado (panel lateral)
  const [evaluation, setEvaluation] = useState(null);
  const [evaluacionMedica, setEvaluacionMedica] = useState(null);
  const [pertinencia_medico, setPertinenciaMedico] = useState(null);
  const [estadoPaciente, setEstadoPaciente] = useState('Pendiente');
  const [respuestaAseguradora, setRespuestaAseguradora] = useState('Pendiente');
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // Estado para almacenar datos de evaluación de todos los registros (para la tabla)
  const [recordsEvaluationData, setRecordsEvaluationData] = useState({});
  
  // Estado para controlar el popup de respuesta aseguradora
  const [popupAseguradora, setPopupAseguradora] = useState(null); // { recordId, position: { x, y } }
  const [savingAseguradora, setSavingAseguradora] = useState(false);
  
  // Estado para controlar el popup de estado paciente
  const [popupEstadoPaciente, setPopupEstadoPaciente] = useState(null); // { recordId, idEpisodio, position: { x, y } }
  const [savingEstadoPaciente, setSavingEstadoPaciente] = useState(false);
  
  // Estado para controlar el popup de decisión médico
  const [popupDecisionMedico, setPopupDecisionMedico] = useState(null); // { recordId, idEvalMedica, position: { x, y } }
  const [savingDecisionMedico, setSavingDecisionMedico] = useState(false);

  useEffect(() => {
    loadRegistros();
    
    // Obtener ID del usuario del token
    const token = localStorage.getItem("auth_token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.sub);
      } catch (error) {
        console.error("Error decodificando token:", error);
      }
    }
  }, []);
  
  // Cerrar popup cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupAseguradora && !event.target.closest('.popup-aseguradora')) {
        setPopupAseguradora(null);
      }
      if (popupEstadoPaciente && !event.target.closest('.popup-estado-paciente')) {
        setPopupEstadoPaciente(null);
      }
      if (popupDecisionMedico && !event.target.closest('.popup-decision-medico')) {
        setPopupDecisionMedico(null);
      }
    };
    
    if (popupAseguradora || popupEstadoPaciente || popupDecisionMedico) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [popupAseguradora, popupEstadoPaciente, popupDecisionMedico]);
  
  // Cargar información de evaluación cuando se selecciona un registro
  useEffect(() => {
    if (selectedRecord) {
      loadEvaluationData(selectedRecord);
    } else {
      // Limpiar estados cuando no hay registro seleccionado
      setEvaluation(null);
      setEvaluacionMedica(null);
      setPertinenciaMedico(null);
      setEstadoPaciente('Pendiente');
      setRespuestaAseguradora('Pendiente');
    }
  }, [selectedRecord]);
  
  const loadEvaluationData = async (record) => {
    setLoadingEvaluation(true);
    try {
      // El record.id es el id_eval_ia según la navegación en ResultadoEvaluacion
      // Intentar obtener la evaluación IA
      try {
        const evaluacionIA = await apiClient.getEvaluacionIA(record.id);
        setEvaluation(evaluacionIA);
        
        // Si hay id_episodio, buscar si existe evaluación médica
        if (evaluacionIA?.id_episodio) {
          // Buscar en los registros si existe evaluación médica para este episodio
          const registros = await apiClient.getRegistros();
          const registroConEval = registros.find(r => 
            (r.id_episodio === evaluacionIA.id_episodio) || 
            (r.id === evaluacionIA.id_episodio)
          );
          
          if (registroConEval?.id_eval_medica) {
            try {
              const evaluacionMedicaExistente = await apiClient.getEvaluacionLeyUrgencia(registroConEval.id_eval_medica);
              setEvaluacionMedica(evaluacionMedicaExistente);
              
              // Obtener comparación para cargar respuesta aseguradora correctamente
              try {
                const comparacion = await apiClient.getComparacionEvaluacion(registroConEval.id_eval_medica);
                
                // Cargar decisión médico desde comparación
                if (comparacion?.decisiones?.medico?.pertinencia !== undefined) {
                  setPertinenciaMedico(comparacion.decisiones.medico.pertinencia);
                } else if (evaluacionMedicaExistente.pertinencia_medico !== null && evaluacionMedicaExistente.pertinencia_medico !== undefined) {
                  setPertinenciaMedico(evaluacionMedicaExistente.pertinencia_medico);
                }
                
                // Convertir pertinencia_aseguradora (boolean) a respuestaAseguradora (string)
                if (comparacion?.decisiones?.aseguradora?.pertinencia !== undefined) {
                  const pertinencia = comparacion.decisiones.aseguradora.pertinencia;
                  if (pertinencia === true) {
                    setRespuestaAseguradora('Aplica');
                  } else if (pertinencia === false) {
                    setRespuestaAseguradora('No aplica');
                  } else {
                    setRespuestaAseguradora('Pendiente');
                  }
                } else {
                  setRespuestaAseguradora('Pendiente');
                }
              } catch (compErr) {
                console.warn('No se pudo obtener comparación:', compErr);
                // Fallback a valores de evaluación médica
                if (evaluacionMedicaExistente.pertinencia_medico !== null && evaluacionMedicaExistente.pertinencia_medico !== undefined) {
                  setPertinenciaMedico(evaluacionMedicaExistente.pertinencia_medico);
                }
                setRespuestaAseguradora('Pendiente');
              }
              
              if (evaluacionMedicaExistente.estado_paciente) {
                setEstadoPaciente(evaluacionMedicaExistente.estado_paciente);
              }
            } catch (err) {
              console.warn('No se pudo obtener evaluación médica:', err);
              setEvaluacionMedica(null);
              setPertinenciaMedico(null);
              setEstadoPaciente('Pendiente');
              setRespuestaAseguradora('Pendiente');
            }
          } else {
            // Si no existe evaluación médica, resetear valores
            setEvaluacionMedica(null);
            setPertinenciaMedico(null);
            setEstadoPaciente('Pendiente');
            setRespuestaAseguradora('Pendiente');
          }
        }
      } catch (err) {
        console.warn('No se pudo obtener evaluación IA:', err);
        setEvaluation(null);
        setEvaluacionMedica(null);
        setPertinenciaMedico(null);
        setEstadoPaciente('Pendiente');
        setRespuestaAseguradora('Pendiente');
      }
    } catch (error) {
      console.error('Error cargando información de evaluación:', error);
      setEvaluation(null);
      setEvaluacionMedica(null);
      setPertinenciaMedico(null);
      setEstadoPaciente('Pendiente');
      setRespuestaAseguradora('Pendiente');
    } finally {
      setLoadingEvaluation(false);
    }
  };
  
  const handleGuardarEstadoPacientePopup = async (idEpisodio, nuevoEstado) => {
    setSavingEstadoPaciente(true);
    
    // Guardar el recordId antes de cerrar el popup
    const recordId = popupEstadoPaciente.recordId;
    
    const payload = {
      estado: nuevoEstado,
    };

    try {
      const respuesta = await apiClient.updateEpisodio(idEpisodio, payload);
      console.log("✅ Estado del paciente actualizado desde popup:", respuesta);
      
      // Cerrar popup
      setPopupEstadoPaciente(null);
      
      // Recargar todos los registros para actualizar la tabla
      const updatedRecords = await loadRegistros();
      
      // Restaurar la selección del registro después de recargar
      if (recordId && updatedRecords) {
        const updatedRecord = updatedRecords.find(r => r.id === recordId);
        if (updatedRecord) {
          setSelectedRecord(updatedRecord);
          await loadEvaluationData(updatedRecord);
        }
      }
    } catch (error) {
      console.error("❌ Error al actualizar el estado del paciente desde popup:", error);
      alert(`Error al actualizar: ${error.message || 'Error desconocido'}`);
    } finally {
      setSavingEstadoPaciente(false);
    }
  };

  const handleGuardarDecisionMedicoPopup = async (idEvalMedica, nuevoValor) => {
    setSavingDecisionMedico(true);
    
    // Guardar el recordId antes de cerrar el popup
    const recordId = popupDecisionMedico.recordId;
    
    // Convertir string a boolean
    let pertinencia_medico = null;
    if (nuevoValor === 'Aplica') {
      pertinencia_medico = true;
    } else if (nuevoValor === 'No aplica') {
      pertinencia_medico = false;
    } else {
      pertinencia_medico = null; // Pendiente
    }

    const payload = {
      pertinencia_medico: pertinencia_medico,
    };

    try {
      const respuesta = await apiClient.updateEvaluacionLeyUrgencia(idEvalMedica, payload);
      console.log("✅ Decisión médico actualizada desde popup:", respuesta);
      
      // Cerrar popup
      setPopupDecisionMedico(null);
      
      // Recargar todos los registros para actualizar la tabla
      const updatedRecords = await loadRegistros();
      
      // Restaurar la selección del registro después de recargar
      if (recordId && updatedRecords) {
        const updatedRecord = updatedRecords.find(r => r.id === recordId);
        if (updatedRecord) {
          setSelectedRecord(updatedRecord);
          await loadEvaluationData(updatedRecord);
        }
      }
    } catch (error) {
      console.error("❌ Error al actualizar la decisión médico desde popup:", error);
      alert(`Error al actualizar: ${error.message || 'Error desconocido'}`);
    } finally {
      setSavingDecisionMedico(false);
    }
  };

  const handleGuardarDecisionAseguradoraPopup = async (idEvalMedica, nuevoValor) => {
    setSavingAseguradora(true);
    
    // Guardar el recordId antes de cerrar el popup
    const recordId = popupAseguradora.recordId;
    
    // Convertir string a boolean
    let pertinencia_aseguradora = null;
    if (nuevoValor === 'Aplica') {
      pertinencia_aseguradora = true;
    } else if (nuevoValor === 'No aplica') {
      pertinencia_aseguradora = false;
    } else {
      pertinencia_aseguradora = null; // Pendiente
    }

    const payload = {
      pertinencia_aseguradora: pertinencia_aseguradora,
    };

    try {
      const respuesta = await apiClient.updateDecisionAseguradora(idEvalMedica, payload);
      console.log("✅ Decisión de aseguradora actualizada desde popup:", respuesta);
      
      // Cerrar popup
      setPopupAseguradora(null);
      
      // Recargar todos los registros para actualizar la tabla
      const updatedRecords = await loadRegistros();
      
      // Restaurar la selección del registro después de recargar
      if (recordId && updatedRecords) {
        const updatedRecord = updatedRecords.find(r => r.id === recordId);
        if (updatedRecord) {
          setSelectedRecord(updatedRecord);
          await loadEvaluationData(updatedRecord);
        }
      }
    } catch (error) {
      console.error("❌ Error al actualizar la decisión de aseguradora desde popup:", error);
      alert(`Error al actualizar: ${error.message || 'Error desconocido'}`);
    } finally {
      setSavingAseguradora(false);
    }
  };

  const handleGuardarDecisionAseguradora = async () => {
    // Verificar que tenemos evaluación médica o al menos el registro seleccionado
    let idEvalMedica = evaluacionMedica?.id_eval_medica;
    
    // Si no hay id_eval_medica en evaluacionMedica, intentar obtenerlo del registro
    if (!idEvalMedica && selectedRecord?.id_eval_medica) {
      idEvalMedica = selectedRecord.id_eval_medica;
    }
    
    if (!idEvalMedica) {
      alert("Error: No se encontró la evaluación médica. Debe crear una evaluación médica primero.");
      return;
    }

    // Convertir respuestaAseguradora (string) a pertinencia_aseguradora (boolean)
    let pertinencia_aseguradora = null;
    if (respuestaAseguradora === 'Aplica') {
      pertinencia_aseguradora = true;
    } else if (respuestaAseguradora === 'No aplica') {
      pertinencia_aseguradora = false;
    } else {
      pertinencia_aseguradora = null; // Pendiente
    }

    const payload = {
      pertinencia_aseguradora: pertinencia_aseguradora,
    };

    console.log("📤 Guardando decisión de aseguradora:", {
      id_eval_medica: idEvalMedica,
      respuestaAseguradora: respuestaAseguradora,
      pertinencia_aseguradora: pertinencia_aseguradora,
      payload: payload,
      url: `${apiClient.baseURL}/evaluacion-ley-urgencia/${idEvalMedica}/aseguradora`
    });

    try {
      const respuesta = await apiClient.updateDecisionAseguradora(idEvalMedica, payload);
      console.log("✅ Decisión de aseguradora actualizada:", respuesta);
      alert("Decisión de aseguradora actualizada correctamente.");
      
      // Recargar la comparación para obtener el valor actualizado
      try {
        const comparacionActualizada = await apiClient.getComparacionEvaluacion(idEvalMedica);
        console.log("📥 Comparación actualizada recibida:", comparacionActualizada);
        // Actualizar el estado local con el valor actualizado
        const pertinencia = comparacionActualizada?.decisiones?.aseguradora?.pertinencia;
        if (pertinencia === true) {
          setRespuestaAseguradora('Aplica');
        } else if (pertinencia === false) {
          setRespuestaAseguradora('No aplica');
        } else {
          setRespuestaAseguradora('Pendiente');
        }
      } catch (compErr) {
        console.warn('No se pudo recargar la comparación después de guardar:', compErr);
      }
      
      // Recargar datos de evaluación y registros para actualizar la tabla
      if (selectedRecord) {
        await loadEvaluationData(selectedRecord);
        // Recargar todos los registros para actualizar la tabla
        await loadRegistros();
      }
    } catch (error) {
      console.error("❌ Error al actualizar la decisión de aseguradora:", error);
      console.error("📋 Detalles del error:", {
        status: error.status,
        message: error.message,
        id_eval_medica: evaluacionMedica.id_eval_medica,
        payload: payload,
        url: `${apiClient.baseURL}/evaluacion-ley-urgencia/${evaluacionMedica.id_eval_medica}/aseguradora`
      });
      const errorMessage = error.message || 'Error desconocido';
      alert(`Error al actualizar la decisión de aseguradora: ${errorMessage}\n\nPor favor, verifique que todos los datos sean correctos e intente nuevamente.`);
    }
  };

  const handleGuardarEvaluacion = async () => {
    if (pertinencia_medico === null) {
      alert("Debe seleccionar una opción antes de guardar.");
      return;
    }

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

    // Si ya existe una evaluación médica, usar PUT para actualizar
    if (evaluacionMedica?.id_eval_medica) {
      // Convertir respuestaAseguradora (string) a pertinencia_aseguradora (boolean)
      let pertinencia_aseguradora = null;
      if (respuestaAseguradora === 'Aplica') {
        pertinencia_aseguradora = true;
      } else if (respuestaAseguradora === 'No aplica') {
        pertinencia_aseguradora = false;
      } else {
        pertinencia_aseguradora = null; // Pendiente
      }
      
      const updatePayload = {
        pertinencia_medico: pertinencia_medico,
        observaciones: null,
        estado_paciente: estadoPaciente,
        pertinencia_aseguradora: pertinencia_aseguradora,
        sugerencia_ia: evaluation.pertinencia_ia || null,
      };

      try {
        const respuesta = await apiClient.updateEvaluacionLeyUrgencia(evaluacionMedica.id_eval_medica, updatePayload);
        console.log("✅ Evaluación actualizada:", respuesta);
        alert("Evaluación actualizada correctamente.");
        // Recargar datos de evaluación y registros para actualizar la tabla
        if (selectedRecord) {
          await loadEvaluationData(selectedRecord);
          // Recargar todos los registros para actualizar la tabla
          await loadRegistros();
        }
      } catch (error) {
        console.error("❌ Error al actualizar la evaluación:", error);
        const errorMessage = error.message || 'Error desconocido';
        alert(`Error al actualizar la evaluación: ${errorMessage}\n\nPor favor, verifique que todos los datos sean correctos e intente nuevamente.`);
      }
    } else {
      // Si no existe, crear nueva evaluación
      const payload = {
        id_episodio: evaluation.id_episodio,
        id_eval_ia: evaluation.id_eval_ia,
        id_medico: userId,
        pertinencia_medico: pertinencia_medico,
        observaciones: null,
        estado_paciente: estadoPaciente,
        respuesta_aseguradora: respuestaAseguradora,
        sugerencia_ia: evaluation.pertinencia_ia || null,
      };

      try {
        const respuesta = await apiClient.createEvaluacionLeyUrgencia(payload);
        console.log("✅ Evaluación guardada:", respuesta);
        alert("Evaluación guardada correctamente.");
        // Recargar datos de evaluación
        if (selectedRecord) {
          loadEvaluationData(selectedRecord);
        }
      } catch (error) {
        console.error("❌ Error al guardar la evaluación:", error);
        const errorMessage = error.message || 'Error desconocido';
        alert(`Error al guardar la evaluación: ${errorMessage}\n\nPor favor, verifique que todos los datos sean correctos e intente nuevamente.`);
      }
    }
  };

  const loadRegistros = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getRegistros();
      
      // Ordenar registros por fecha (más reciente primero) para mantener orden consistente
      const sortedData = [...data].sort((a, b) => {
        // Intentar ordenar por fecha
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        if (dateB !== dateA) {
          return dateB - dateA; // Más reciente primero
        }
        // Si las fechas son iguales, ordenar por ID (más reciente primero)
        return (b.id || 0) - (a.id || 0);
      });
      
      setRecords(sortedData);
      
      // Cargar datos de evaluación para cada registro
      await loadRecordsEvaluationData(sortedData);
      
      // Devolver los registros ordenados para uso inmediato
      return sortedData;
    } catch (err) {
      console.error('Error cargando registros:', err);
      setError(err.message || 'Error al cargar registros');
      // En caso de error, mantener array vacío
      setRecords([]);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  const loadRecordsEvaluationData = async (registros) => {
    const evaluationDataMap = {};
    
    try {
      // Paso 1: Obtener todos los datos necesarios en paralelo (una sola vez)
      const [evaluacionesIA, episodios] = await Promise.all([
        apiClient.request('/evaluacion-ia', { method: 'GET' }).catch(() => []), // GET /api/evaluacion-ia
        apiClient.getEpisodios().catch(() => []), // GET /api/episodios
      ]);
      
      // Paso 2: Para cada registro, obtener los datos faltantes
      const promises = registros.map(async (record) => {
        try {
          const idEpisodio = record.id; // El id del registro es el id_episodio
          
          // 1. Obtener recomendación IA: filtrar evaluacionesIA por id_episodio
          const evaluacionIA = evaluacionesIA.find(ev => ev.id_episodio === idEpisodio);
          const recomendacionIA = evaluacionIA?.pertinencia_ia ?? null;
          
          // 2. Obtener respuesta doctor y aseguradora (si existe id_eval_medica)
          let respuestaDoctor = null;
          let respuestaAseguradora = null;
          let comparacionEvaluacion = null;
          
          // Intentar obtener id_eval_medica del registro
          const idEvalMedica = record.id_eval_medica;
          
          if (idEvalMedica) {
            try {
              comparacionEvaluacion = await apiClient.getComparacionEvaluacion(idEvalMedica);
              respuestaDoctor = comparacionEvaluacion?.decisiones?.medico?.pertinencia ?? null;
              respuestaAseguradora = comparacionEvaluacion?.decisiones?.aseguradora?.pertinencia ?? null;
              
              console.log(`Registro ${record.id}: respuestaAseguradora =`, respuestaAseguradora);
            } catch (err) {
              console.warn(`No se pudo obtener comparación de evaluación para registro ${record.id}:`, err);
              console.warn(`id_eval_medica usado:`, idEvalMedica);
            }
          } else {
            console.warn(`Registro ${record.id}: No tiene id_eval_medica. Campos disponibles:`, Object.keys(record));
          }
          
          // 3. Obtener estado paciente: filtrar episodios por id_episodio
          const episodio = episodios.find(ep => ep.id_episodio === idEpisodio);
          const estadoPaciente = episodio?.estado ?? record.estado ?? record.status ?? null;
          
          return {
            recordId: record.id,
            evaluacionIA: evaluacionIA || null,
            recomendacionIA,
            comparacionEvaluacion,
            respuestaDoctor,
            respuestaAseguradora,
            estadoEpisodio: estadoPaciente,
          };
        } catch (error) {
          console.error(`Error cargando datos de evaluación para registro ${record.id}:`, error);
          return {
            recordId: record.id,
            evaluacionIA: null,
            recomendacionIA: null,
            comparacionEvaluacion: null,
            respuestaDoctor: null,
            respuestaAseguradora: null,
            estadoEpisodio: record.estado || record.status || null,
          };
        }
      });
      
      const results = await Promise.all(promises);
      
      // Crear el mapa de datos de evaluación
      results.forEach((result) => {
        evaluationDataMap[result.recordId] = {
          evaluacionIA: result.evaluacionIA,
          recomendacionIA: result.recomendacionIA,
          comparacionEvaluacion: result.comparacionEvaluacion,
          respuestaDoctor: result.respuestaDoctor,
          respuestaAseguradora: result.respuestaAseguradora,
          estadoEpisodio: result.estadoEpisodio,
        };
      });
      
      setRecordsEvaluationData(evaluationDataMap);
    } catch (error) {
      console.error('Error cargando datos de evaluación:', error);
      // En caso de error, inicializar con valores vacíos
      registros.forEach(record => {
        evaluationDataMap[record.id] = {
          evaluacionIA: null,
          recomendacionIA: null,
          comparacionEvaluacion: null,
          respuestaDoctor: null,
          respuestaAseguradora: null,
          estadoEpisodio: record.estado || record.status || null,
        };
      });
      setRecordsEvaluationData(evaluationDataMap);
    }
  };

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
      key: 'estado_paciente',
      label: 'Estado Paciente',
      render: (value, record) => {
        const evalData = recordsEvaluationData[record.id];
        const estado = evalData?.estadoEpisodio || record.estado || record.status;
        
        // Obtener id_episodio del registro (el id del registro es el id_episodio)
        const idEpisodio = record.id_episodio || record.id || evalData?.idEpisodio;
        const puedeEditar = !!idEpisodio;
        
        if (!estado) {
          return <span className="text-gray-400">-</span>;
        }
        
        // Mapear estados comunes a badges
        let badgeContent;
        switch (estado) {
          case 'Pendiente':
            badgeContent = <Badge variant="warning">Pendiente</Badge>;
            break;
          case 'Internado':
            badgeContent = <Badge variant="info">Internado</Badge>;
            break;
          case 'De alta':
            badgeContent = <Badge variant="success">De alta</Badge>;
            break;
          case 'Fallecido':
            badgeContent = <Badge variant="danger">Fallecido</Badge>;
            break;
          case 'completed':
          case 'Completado':
            badgeContent = <Badge variant="success">Completado</Badge>;
            break;
          case 'evaluating':
          case 'Evaluando':
            badgeContent = <Badge variant="warning">Evaluando</Badge>;
            break;
          case 'submitted':
          case 'Enviado':
            badgeContent = <Badge variant="info">Enviado</Badge>;
            break;
          case 'draft':
          case 'Borrador':
            badgeContent = <Badge>Borrador</Badge>;
            break;
          default:
            badgeContent = <Badge>{estado}</Badge>;
        }
        
        return (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                if (puedeEditar) {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const viewportWidth = window.innerWidth;
                  const viewportHeight = window.innerHeight;
                  
                  // Calcular posición centrada horizontalmente sobre el badge
                  let x = rect.left + rect.width / 2;
                  let y = rect.bottom + 5;
                  
                  // Ajustar si se sale por la derecha
                  if (x + 90 > viewportWidth) {
                    x = viewportWidth - 90;
                  }
                  // Ajustar si se sale por la izquierda
                  if (x - 90 < 0) {
                    x = 90;
                  }
                  // Ajustar si se sale por abajo (mostrar arriba en su lugar)
                  if (y + 150 > viewportHeight) {
                    y = rect.top - 150;
                  }
                  
                  setPopupEstadoPaciente({
                    recordId: record.id,
                    idEpisodio: idEpisodio,
                    currentValue: estado,
                    position: {
                      x: x,
                      y: y
                    }
                  });
                }
              }}
              className={`${puedeEditar ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
              disabled={!puedeEditar}
            >
              {badgeContent}
            </button>
          </div>
        );
      },
    },
    {
      key: 'recomendacion_ia',
      label: 'Recomendación IA',
      render: (value, record) => {
        const evalData = recordsEvaluationData[record.id];
        const pertinencia = evalData?.recomendacionIA;
        if (pertinencia === null || pertinencia === undefined) {
          return <span className="text-gray-400">-</span>;
        }
        if (pertinencia === true) {
          return <Badge variant="success">Aplica</Badge>;
        } else if (pertinencia === false) {
          return <Badge variant="danger">No Aplica</Badge>;
        } else {
          return <span className="text-gray-400">-</span>;
        }
      },
    },
    {
      key: 'decision_medico',
      label: 'Decisión Médico',
      render: (value, record) => {
        const evalData = recordsEvaluationData[record.id];
        // Usar respuestaDoctor de comparacionEvaluacion.decisiones.medico.pertinencia
        const pertinencia = evalData?.respuestaDoctor;
        
        // Obtener id_eval_medica para permitir edición
        const idEvalMedica = record.id_eval_medica || evalData?.comparacionEvaluacion?.id_eval_medica;
        const puedeEditar = !!idEvalMedica;
        
        if (pertinencia === null || pertinencia === undefined) {
          return <span className="text-gray-400">-</span>;
        }
        
        // Mostrar según el valor: true = "Aplica", false = "No Aplica", null/undefined = "Pendiente"
        let badgeContent;
        if (pertinencia === true) {
          badgeContent = <Badge variant="success">Aplica</Badge>;
        } else if (pertinencia === false) {
          badgeContent = <Badge variant="danger">No Aplica</Badge>;
        } else {
          badgeContent = <Badge variant="warning">Pendiente</Badge>;
        }
        
        return (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                if (puedeEditar) {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const viewportWidth = window.innerWidth;
                  const viewportHeight = window.innerHeight;
                  
                  // Calcular posición centrada horizontalmente sobre el badge
                  let x = rect.left + rect.width / 2;
                  let y = rect.bottom + 5;
                  
                  // Ajustar si se sale por la derecha
                  if (x + 90 > viewportWidth) {
                    x = viewportWidth - 90;
                  }
                  // Ajustar si se sale por la izquierda
                  if (x - 90 < 0) {
                    x = 90;
                  }
                  // Ajustar si se sale por abajo (mostrar arriba en su lugar)
                  if (y + 120 > viewportHeight) {
                    y = rect.top - 120;
                  }
                  
                  setPopupDecisionMedico({
                    recordId: record.id,
                    idEvalMedica: idEvalMedica,
                    currentValue: pertinencia,
                    position: {
                      x: x,
                      y: y
                    }
                  });
                }
              }}
              className={`${puedeEditar ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
              disabled={!puedeEditar}
            >
              {badgeContent}
            </button>
          </div>
        );
      },
    },
    {
      key: 'respuesta_aseguradora',
      label: 'Respuesta Aseguradora',
      render: (value, record) => {
        const evalData = recordsEvaluationData[record.id];
        // Usar respuestaAseguradora de comparacionEvaluacion.decisiones.aseguradora.pertinencia
        let pertinencia = evalData?.respuestaAseguradora;
        
        // Si no está en respuestaAseguradora, intentar obtenerlo de comparacionEvaluacion directamente
        if ((pertinencia === null || pertinencia === undefined) && evalData?.comparacionEvaluacion) {
          pertinencia = evalData.comparacionEvaluacion?.decisiones?.aseguradora?.pertinencia;
        }
        
        // Verificar si hay id_eval_medica para permitir edición
        const idEvalMedica = record.id_eval_medica || evalData?.comparacionEvaluacion?.id_eval_medica;
        const puedeEditar = !!idEvalMedica;
        
        // Mostrar según el valor: true = "Aplica", false = "No Aplica", null/undefined = "Pendiente"
        let badgeContent;
        if (pertinencia === true) {
          badgeContent = <Badge variant="success">Aplica</Badge>;
        } else if (pertinencia === false) {
          badgeContent = <Badge variant="danger">No Aplica</Badge>;
        } else {
          // null o undefined se muestran como "Pendiente"
          badgeContent = <Badge variant="warning">Pendiente</Badge>;
        }
        
        return (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                if (puedeEditar) {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const viewportWidth = window.innerWidth;
                  const viewportHeight = window.innerHeight;
                  
                  // Calcular posición centrada horizontalmente sobre el badge
                  let x = rect.left + rect.width / 2;
                  let y = rect.bottom + 5;
                  
                  // Ajustar si se sale por la derecha
                  if (x + 90 > viewportWidth) {
                    x = viewportWidth - 90;
                  }
                  // Ajustar si se sale por la izquierda
                  if (x - 90 < 0) {
                    x = 90;
                  }
                  // Ajustar si se sale por abajo (mostrar arriba en su lugar)
                  if (y + 120 > viewportHeight) {
                    y = rect.top - 120;
                  }
                  
                  setPopupAseguradora({
                    recordId: record.id,
                    idEvalMedica: idEvalMedica,
                    currentValue: pertinencia,
                    position: {
                      x: x,
                      y: y
                    }
                  });
                }
              }}
              className={`${puedeEditar ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
              disabled={!puedeEditar}
            >
              {badgeContent}
            </button>
          </div>
        );
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
              <input
                type="text"
                placeholder="Buscar por paciente, episodio o diagnóstico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
                data-search
              />
            </div>
          </div>

          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mr-3" />
                <p className="text-gray-600">Cargando registros...</p>
              </div>
            </div>
          ) : error ? (
            <div className="card bg-red-50 border-red-200">
              <p className="text-red-800 mb-4">Error al cargar registros: {error}</p>
              <button
                onClick={loadRegistros}
                className="btn btn-outline"
              >
                Reintentar
              </button>
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
      
      {/* Popup para cambiar Respuesta Aseguradora */}
      {popupAseguradora && (
        <div
          className="popup-aseguradora fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px]"
          style={{
            left: `${popupAseguradora.position.x}px`,
            top: `${popupAseguradora.position.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-b border-gray-200">
            Cambiar Estado
          </div>
          <div className="py-1">
            {['Pendiente', 'Aplica', 'No aplica'].map((opcion) => {
              const isSelected = 
                (opcion === 'Pendiente' && popupAseguradora.currentValue === null) ||
                (opcion === 'Aplica' && popupAseguradora.currentValue === true) ||
                (opcion === 'No aplica' && popupAseguradora.currentValue === false);
              
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => {
                    if (!savingAseguradora && opcion !== (popupAseguradora.currentValue === true ? 'Aplica' : popupAseguradora.currentValue === false ? 'No aplica' : 'Pendiente')) {
                      handleGuardarDecisionAseguradoraPopup(popupAseguradora.idEvalMedica, opcion);
                    }
                  }}
                  disabled={savingAseguradora}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  } ${savingAseguradora ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span>{opcion}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Popup para cambiar Estado Paciente */}
      {popupEstadoPaciente && (
        <div
          className="popup-estado-paciente fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px]"
          style={{
            left: `${popupEstadoPaciente.position.x}px`,
            top: `${popupEstadoPaciente.position.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-b border-gray-200">
            Cambiar Estado
          </div>
          <div className="py-1">
            {['Pendiente', 'Internado', 'De alta', 'Fallecido'].map((opcion) => {
              const isSelected = opcion === popupEstadoPaciente.currentValue;
              
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => {
                    if (!savingEstadoPaciente && opcion !== popupEstadoPaciente.currentValue) {
                      handleGuardarEstadoPacientePopup(popupEstadoPaciente.idEpisodio, opcion);
                    }
                  }}
                  disabled={savingEstadoPaciente}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  } ${savingEstadoPaciente ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span>{opcion}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Popup para cambiar Decisión Médico */}
      {popupDecisionMedico && (
        <div
          className="popup-decision-medico fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[180px]"
          style={{
            left: `${popupDecisionMedico.position.x}px`,
            top: `${popupDecisionMedico.position.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 border-b border-gray-200">
            Cambiar Estado
          </div>
          <div className="py-1">
            {['Aplica', 'No aplica'].map((opcion) => {
              const isSelected = 
                (opcion === 'Aplica' && popupDecisionMedico.currentValue === true) ||
                (opcion === 'No aplica' && popupDecisionMedico.currentValue === false);
              
              return (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => {
                    if (!savingDecisionMedico && opcion !== (popupDecisionMedico.currentValue === true ? 'Aplica' : 'No aplica')) {
                      handleGuardarDecisionMedicoPopup(popupDecisionMedico.idEvalMedica, opcion);
                    }
                  }}
                  disabled={savingDecisionMedico}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  } ${savingDecisionMedico ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span>{opcion}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
