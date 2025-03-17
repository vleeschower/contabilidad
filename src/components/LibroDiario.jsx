import React, { useState, useEffect } from 'react';
import { getMovimientosPorFecha, getCuentas, getNombreEmpresa } from '../services/api';
import Swal from 'sweetalert2';

const LibroDiario = () => {
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

    // Generar el libro diario
    const handleGenerarLibroDiario = async () => {
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
                text: 'El libro diario se ha generado correctamente.',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al generar el libro diario.',
            });
        }
    };

    // Agrupar movimientos por número de movimiento
    const agruparMovimientosPorNumero = (movimientos) => {
        const agrupados = {};
        movimientos.forEach((movimiento) => {
            if (!agrupados[movimiento.numero_movimiento]) {
                agrupados[movimiento.numero_movimiento] = [];
            }
            agrupados[movimiento.numero_movimiento].push(movimiento);
        });
        return agrupados;
    };

    // Obtener el nombre de la cuenta por su ID
    const obtenerNombreCuenta = (cuentaId) => {
        const cuenta = cuentas.find((c) => c.id === parseInt(cuentaId));
        return cuenta ? cuenta.nombre : 'Cuenta no encontrada';
    };

    // Calcular totales de Debe y Haber
    const calcularTotales = (movimientos) => {
        let totalDebe = 0;
        let totalHaber = 0;
        movimientos.forEach((movimiento) => {
            totalDebe += parseFloat(movimiento.debe || 0);
            totalHaber += parseFloat(movimiento.haber || 0);
        });
        return { totalDebe, totalHaber };
    };

    const movimientosAgrupados = agruparMovimientosPorNumero(movimientos);
    const { totalDebe, totalHaber } = calcularTotales(movimientos);

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-dark text-white">
                    <h5 className="card-title mb-0">Libro Diario</h5>
                    <small>Genere el libro diario para un período de fechas.</small>
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
                            onClick={handleGenerarLibroDiario}
                        >
                            Generar Libro Diario
                        </button>
                    </div>

                    {movimientos.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-center">{nombreEmpresa}</h4>
                            <h5 className="text-center">Libro Diario del {fechaInicial} al {fechaFinal}</h5>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Cuenta</th>
                                        <th>Descripción</th>
                                        <th>Debe</th>
                                        <th>Haber</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(movimientosAgrupados).map(([numeroMovimiento, movimientos]) => (
                                        <React.Fragment key={numeroMovimiento}>
                                            <tr>
                                                <td colSpan="5" className="text-center fw-bold">
                                                    Número de Movimiento: {numeroMovimiento}
                                                </td>
                                            </tr>
                                            {movimientos.map((movimiento) => (
                                                <tr key={movimiento.id}>
                                                    <td>{new Date(movimiento.fecha).toISOString().split('T')[0]}</td>
                                                    <td>{obtenerNombreCuenta(movimiento.cuenta_id)}</td>
                                                    <td>{movimiento.descripcion}</td>
                                                    <td>${parseFloat(movimiento.debe || 0).toFixed(2)}</td>
                                                    <td>${parseFloat(movimiento.haber || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <th colSpan="3">Totales</th>
                                        <th>${totalDebe.toFixed(2)}</th>
                                        <th>${totalHaber.toFixed(2)}</th>
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

export default LibroDiario;