import React, { useState, useEffect } from 'react';
import { getMovimientosPorFecha, getCuentas, getNombreEmpresa } from '../services/api';
import Swal from 'sweetalert2';

const LibroMayor = () => {
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

    // Generar el libro mayor
    const handleGenerarLibroMayor = async () => {
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
                text: 'El libro mayor se ha generado correctamente.',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al generar el libro mayor.',
            });
        }
    };

    // Agrupar movimientos por cuenta
    const agruparMovimientosPorCuenta = (movimientos) => {
        const agrupados = {};
        movimientos.forEach((movimiento) => {
            if (!agrupados[movimiento.cuenta_id]) {
                agrupados[movimiento.cuenta_id] = [];
            }
            agrupados[movimiento.cuenta_id].push(movimiento);
        });
        return agrupados;
    };

    // Obtener el nombre de la cuenta por su ID
    const obtenerNombreCuenta = (cuentaId) => {
        const cuenta = cuentas.find((c) => c.id === parseInt(cuentaId));
        return cuenta ? cuenta.nombre : 'Cuenta no encontrada';
    };

    // Calcular totales de Debe y Haber para una cuenta
    const calcularTotalesCuenta = (movimientos) => {
        let totalDebe = 0;
        let totalHaber = 0;
        movimientos.forEach((movimiento) => {
            totalDebe += parseFloat(movimiento.debe || 0);
            totalHaber += parseFloat(movimiento.haber || 0);
        });
        return { totalDebe, totalHaber };
    };

    // Calcular el saldo (diferencia entre debe y haber)
    const calcularSaldo = (totalDebe, totalHaber) => {
        const saldo = Math.abs(totalDebe - totalHaber);
        if (totalDebe > totalHaber) {
            return { saldoDebe: saldo, saldoHaber: 0 };
        } else {
            return { saldoDebe: 0, saldoHaber: saldo };
        }
    };

    const movimientosAgrupados = agruparMovimientosPorCuenta(movimientos);

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-dark text-white">
                    <h5 className="card-title mb-0">Libro Mayor</h5>
                    <small>Genere el libro mayor para un período de fechas.</small>
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
                            onClick={handleGenerarLibroMayor}
                        >
                            Generar Libro Mayor
                        </button>
                    </div>

                    {movimientos.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-center">{nombreEmpresa}</h4>
                            <h5 className="text-center">Libro Mayor del {fechaInicial} al {fechaFinal}</h5>
                            {Object.entries(movimientosAgrupados).map(([cuentaId, movimientos]) => {
                                const nombreCuenta = obtenerNombreCuenta(cuentaId);
                                const { totalDebe, totalHaber } = calcularTotalesCuenta(movimientos);
                                const { saldoDebe, saldoHaber } = calcularSaldo(totalDebe, totalHaber);

                                return (
                                    <div key={cuentaId} className="mb-4">
                                        <h6 className="fw-bold">{nombreCuenta}</h6>
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Número de Movimiento</th>
                                                    <th>Fecha</th>
                                                    <th>Descripción</th>
                                                    <th>Debe</th>
                                                    <th>Haber</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {movimientos.map((movimiento) => (
                                                    <tr key={movimiento.id}>
                                                        <td>{movimiento.numero_movimiento}</td>
                                                        <td>{new Date(movimiento.fecha).toISOString().split('T')[0]}</td>
                                                        <td>{movimiento.descripcion}</td>
                                                        <td>${parseFloat(movimiento.debe || 0).toFixed(2)}</td>
                                                        <td>${parseFloat(movimiento.haber || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th colSpan="3">Totales</th>
                                                    <th>${totalDebe.toFixed(2)}</th>
                                                    <th>${totalHaber.toFixed(2)}</th>
                                                </tr>
                                                <tr>
                                                    <th colSpan="3">Saldo</th>
                                                    <th>${saldoDebe.toFixed(2)}</th>
                                                    <th>${saldoHaber.toFixed(2)}</th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LibroMayor;