import React, { useState, useEffect } from 'react';
import { getMovimientosPorFecha, getCuentas, getNombreEmpresa } from '../services/api';
import Swal from 'sweetalert2';

const BalanceComprobacion = () => {
    const [fechaInicial, setFechaInicial] = useState('');
    const [fechaFinal, setFechaFinal] = useState('');
    const [cuentas, setCuentas] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [nombreEmpresa, setNombreEmpresa] = useState('');

    // Cargar cuentas al montar el componente
    useEffect(() => {
        const fetchCuentas = async () => {
            try {
                const cuentas = await getCuentas();
                setCuentas(cuentas);
            } catch (error) {
                console.error('Error al obtener las cuentas:', error);
            }
        };
        fetchCuentas();
    }, []);

    // Obtener el nombre de la empresa
    useEffect(() => {
        const fetchNombreEmpresa = async () => {
            try {
                const nombreEmpresa = await getNombreEmpresa();
                setNombreEmpresa(nombreEmpresa.nombre);
            } catch (error) {
                console.error('Error al obtener el nombre de la empresa:', error);
            }
        };
        fetchNombreEmpresa();
    }, []);

    // Manejar cambios en los campos de fecha
    const handleFechaInicialChange = (event) => {
        setFechaInicial(event.target.value);
    };

    const handleFechaFinalChange = (event) => {
        setFechaFinal(event.target.value);
    };

    // Generar la balanza de comprobación
    const handleGenerarBalanza = async () => {
        if (!fechaInicial || !fechaFinal) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, ingrese ambas fechas.',
            });
            return;
        }

        try {
            const movimientos = await getMovimientosPorFecha(fechaInicial, fechaFinal);
            setMovimientos(movimientos);

            // Mostrar alerta de éxito
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'La balanza de comprobación se ha generado correctamente.',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al generar la balanza de comprobación.',
            });
        }
    };

    // Agrupar movimientos por cuenta y calcular totales
    const calcularTotalesPorCuenta = (movimientos) => {
        const totalesPorCuenta = {};
        movimientos.forEach((movimiento) => {
            if (!totalesPorCuenta[movimiento.cuenta_id]) {
                totalesPorCuenta[movimiento.cuenta_id] = { debe: 0, haber: 0 };
            }
            totalesPorCuenta[movimiento.cuenta_id].debe += parseFloat(movimiento.debe || 0);
            totalesPorCuenta[movimiento.cuenta_id].haber += parseFloat(movimiento.haber || 0);
        });
        return totalesPorCuenta;
    };

    // Obtener el nombre de la cuenta por su ID
    const obtenerNombreCuenta = (cuentaId) => {
        const cuenta = cuentas.find((c) => c.id === parseInt(cuentaId));
        return cuenta ? cuenta.nombre : 'Cuenta no encontrada';
    };

    // Calcular el saldo (diferencia entre debe y haber)
    const calcularSaldo = (debe, haber) => {
        return debe - haber;
    };

    const totalesPorCuenta = calcularTotalesPorCuenta(movimientos);

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-dark text-white">
                    <h5 className="card-title mb-0">Balanza de Comprobación</h5>
                    <small>Genere la balanza de comprobación para un período de fechas.</small>
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <label htmlFor="fechaInicial" className="form-label">Fecha Inicial</label>
                        <input
                            type="date"
                            className="form-control"
                            id="fechaInicial"
                            value={fechaInicial}
                            onChange={handleFechaInicialChange}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="fechaFinal" className="form-label">Fecha Final</label>
                        <input
                            type="date"
                            className="form-control"
                            id="fechaFinal"
                            value={fechaFinal}
                            onChange={handleFechaFinalChange}
                            required
                        />
                    </div>
                    <div className="d-grid">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleGenerarBalanza}
                        >
                            Generar Balanza de Comprobación
                        </button>
                    </div>

                    {movimientos.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-center">{nombreEmpresa}</h4>
                            <h5 className="text-center">Balanza de Comprobación del {fechaInicial} al {fechaFinal}</h5>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Cuenta</th>
                                        <th>Debe</th>
                                        <th>Haber</th>
                                        <th>Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(totalesPorCuenta).map(([cuentaId, totales]) => {
                                        const nombreCuenta = obtenerNombreCuenta(cuentaId);
                                        const saldo = calcularSaldo(totales.debe, totales.haber);

                                        return (
                                            <tr key={cuentaId}>
                                                <td>{nombreCuenta}</td>
                                                <td>${totales.debe.toFixed(2)}</td>
                                                <td>${totales.haber.toFixed(2)}</td>
                                                <td>${saldo.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th>Totales</th>
                                        <th>${Object.values(totalesPorCuenta).reduce((sum, t) => sum + t.debe, 0).toFixed(2)}</th>
                                        <th>${Object.values(totalesPorCuenta).reduce((sum, t) => sum + t.haber, 0).toFixed(2)}</th>
                                        <th></th>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BalanceComprobacion;