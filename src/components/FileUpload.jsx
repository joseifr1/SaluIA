import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export function FileUpload({
  label = 'Subir archivo',
  accept = '.pdf',
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  onFilesChange,
  error,
  disabled = false,
  className = '',
  ...props
}) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleFiles = (newFiles) => {
    const fileArray = Array.from(newFiles);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      // Validar tipo de archivo
      if (accept && !file.type.includes('pdf')) {
        errors.push(`${file.name}: Solo se permiten archivos PDF`);
        return;
      }

      // Validar tamaño
      if (file.size > maxSize) {
        errors.push(`${file.name}: El archivo es demasiado grande (máximo ${Math.round(maxSize / 1024 / 1024)}MB)`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      console.error('Errores de validación:', errors);
      // Aquí podrías mostrar un toast o alert con los errores
    }

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadFile = async (file, index) => {
    setUploading(true);
    setUploadProgress(prev => ({ ...prev, [index]: 0 }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [index]: progress }));
        }
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const result = await response.json();
      console.log('Archivo subido exitosamente:', result);

      // Actualizar el estado del archivo como subido
      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, uploaded: true, url: result.url } : f
      ));

    } catch (error) {
      console.error('Error subiendo archivo:', error);
      setFiles(prev => prev.map((f, i) =>
        i === index ? { ...f, error: error.message } : f
      ));
    } finally {
      setUploading(false);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[index];
        return newProgress;
      });
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {!multiple && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Drop zone */}
      <div
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-300',
          error ? 'border-red-500' : '',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
          {...props}
        />

        <div className="space-y-2">
          <Upload className={clsx(
            'mx-auto h-12 w-12',
            dragActive ? 'text-primary' : 'text-gray-400'
          )} />

          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-primary">Haz clic para subir</span> o arrastra y suelta
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Solo archivos PDF (máximo {Math.round(maxSize / 1024 / 1024)}MB)
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Archivos seleccionados ({files.length})
          </h4>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Upload progress */}
                  {uploadProgress[index] !== undefined && (
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[index]}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {uploadProgress[index]}%
                      </span>
                    </div>
                  )}

                  {/* Upload status */}
                  {file.uploaded && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}

                  {file.error && (
                    <AlertCircle className="w-5 h-5 text-red-500" title={file.error} />
                  )}

                  {/* Remove button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Upload all button */}
          {!uploading && files.some(f => !f.uploaded && !f.error) && (
            <button
              onClick={() => {
                files.forEach((file, index) => {
                  if (!file.uploaded && !file.error) {
                    uploadFile(file, index);
                  }
                });
              }}
              className="btn btn-primary w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Subir todos los archivos
            </button>
          )}
        </div>
      )}
    </div>
  );
}
