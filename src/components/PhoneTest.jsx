import React, { useState } from 'react';
import { MaskedInput } from './MaskedInput.jsx';

export function PhoneTest() {
  const [phone, setPhone] = useState('');

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Test del Campo de Teléfono</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Teléfono:</label>
        <MaskedInput
          mask="+56 9 #### ####"
          maskChar="_"
          value={phone}
          onChange={setPhone}
          normalizePhone={true}
          placeholder="+56 9 1234 5678"
          className="w-full"
        />
      </div>

      <div className="bg-gray-100 p-3 rounded">
        <p><strong>Valor almacenado:</strong> "{phone}"</p>
        <p><strong>Longitud:</strong> {phone.length}</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">Instrucciones de prueba:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Escribe solo números (ej: 123456789)</li>
          <li>Verifica que NO se agregue un "9" automáticamente</li>
          <li>La máscara debe mostrar: +56 9 1234 5678</li>
          <li>El valor almacenado debe ser solo los dígitos que escribiste</li>
        </ol>
      </div>
    </div>
  );
}

