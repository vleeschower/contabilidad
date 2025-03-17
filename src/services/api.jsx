const API_URL = 'http://localhost:5000/api';

export const getCuentas = async () => {
    const response = await fetch(`${API_URL}/cuentas`);
    if (!response.ok) {
        throw new Error('Error al obtener las cuentas');
    }
    return response.json();
};

export const createMovimiento = async (movimiento) => {
    const response = await fetch(`${API_URL}/movimientos`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(movimiento),
    });
    if (!response.ok) {
        throw new Error('Error al crear el movimiento');
    }
    return response.json();
};

export const getAsientoApertura = async () => {
    const response = await fetch(`${API_URL}/movimientos?descripcion=Asiento de Apertura`);
    if (!response.ok) {
        throw new Error('Error al obtener el asiento de apertura');
    }
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
};

export const getUltimoNumeroMovimiento = async () => {
    const response = await fetch(`${API_URL}/movimientos/ultimo-numero`);
    if (!response.ok) {
        throw new Error('Error al obtener el último número de movimiento');
    }
    const data = await response.json();
    return data.ultimoNumero || 1; // Si no hay movimientos, devuelve 1
};

export const getMovimientosPorFecha = async (fechaInicial, fechaFinal) => {
    // Asegúrate de que las fechas estén en formato YYYY-MM-DD
    const fechaInicialFormateada = new Date(fechaInicial).toISOString().split('T')[0];
    const fechaFinalFormateada = new Date(fechaFinal).toISOString().split('T')[0];

    const response = await fetch(`${API_URL}/movimientos?fechaInicial=${fechaInicialFormateada}&fechaFinal=${fechaFinalFormateada}`);
    if (!response.ok) {
        throw new Error('Error al obtener los movimientos');
    }
    return response.json();
};

export const guardarNombreEmpresa = async (empresa) => {
    const response = await fetch(`${API_URL}/empresa`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(empresa),
    });
    if (!response.ok) {
        throw new Error('Error al guardar el nombre de la empresa');
    }
    return response.json();
};

export const getNombreEmpresa = async () => {
    const response = await fetch(`${API_URL}/nombreEmpresa`);
    if (!response.ok) {
        throw new Error('Error al obtener el nombre de la empresa');
    }
    const data = await response.json();
    return data; // Devuelve el objeto completo { nombre: "Nombre de la Empresa" }
};
