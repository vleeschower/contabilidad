import React, { useState, useEffect } from 'react';
import { getMovimientosPorFecha, getCuentas, getNombreEmpresa } from '../services/api';
import Swal from 'sweetalert2';

const EstadoDeResultados = () => {
    const [fechaInicial, setFechaInicial] = useState('');
    const [fechaFinal, setFechaFinal] = useState('');
    const [estadoResultados, setEstadoResultados] = useState(null);
    const [cuentas, setCuentas] = useState([]);
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

    // Generar el estado de resultados
    const handleGenerarEstadoResultados = async () => {
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
            const estadoCalculado = calcularEstadoResultados(movimientos);
            setEstadoResultados(estadoCalculado);

            // Mostrar alerta de éxito
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'El estado de resultados se ha generado correctamente.',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al generar el estado de resultados.',
            });
        }
    };

    // Calcular el estado de resultados
    const calcularEstadoResultados = (movimientos) => {
        const saldos = {};

        // Calcular saldos de cada cuenta
        movimientos.forEach(movimiento => {
            const { cuenta_id, debe, haber } = movimiento;
            if (!saldos[cuenta_id]) {
                saldos[cuenta_id] = 0;
            }
            const cuenta = cuentas.find(c => c.id === parseInt(cuenta_id));
            if (cuenta) {
                if (cuenta.clase === 'ingresos') {
                    // Ingresos: haber aumenta, debe disminuye
                    saldos[cuenta_id] += (haber - debe);
                } else if (cuenta.clase === 'costos' || cuenta.clase === 'gastos') {
                    // Costos y gastos: debe aumenta, haber disminuye
                    saldos[cuenta_id] += (debe - haber);
                }
            }
        });

        const ingresos = {};
        const costos = {};
        const gastosGenerales = {};

        Object.keys(saldos).forEach(cuenta_id => {
            const cuenta = cuentas.find(c => c.id === parseInt(cuenta_id));
            if (cuenta) {
                if (cuenta.clase === 'ingresos') {
                    ingresos[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'costos') {
                    costos[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'gastos') {
                    gastosGenerales[cuenta.nombre] = saldos[cuenta_id];
                }
            }
        });

        // Calcular totales
        const totalIngresos = Object.values(ingresos).reduce((sum, saldo) => sum + saldo, 0);
        const totalCostos = Object.values(costos).reduce((sum, saldo) => sum + saldo, 0);
        const totalGastosGenerales = Object.values(gastosGenerales).reduce((sum, saldo) => sum + saldo, 0);
        const utilidadBruta = totalIngresos - totalCostos;
        const perdidaPeriodo= utilidadBruta-totalGastosGenerales;

        return {
            ingresos,
            costos,
            gastosGenerales,
            totalIngresos,
            totalCostos,
            totalGastosGenerales,
            utilidadBruta,
            perdidaPeriodo,
        };
    };

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-dark text-white">
                    <h5 className="card-title mb-0">Estado de Resultados</h5>
                    <small>Genere el estado de resultados para un período de fechas.</small>
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
                            onClick={handleGenerarEstadoResultados}
                        >
                            Generar Estado de Resultados
                        </button>
                    </div>

                    {estadoResultados && (
                        <div className="mt-4">
                            <h4 className="text-center">{nombreEmpresa}</h4>
                            <h5 className="text-center">Estado de Resultados del {fechaInicial} al {fechaFinal}</h5>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Concepto</th>
                                        <th>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td colSpan="2" className="fw-bold">Ingresos</td>
                                    </tr>
                                    {Object.entries(estadoResultados.ingresos).map(([nombre, saldo]) => (
                                        <tr key={nombre}>
                                            <td>{nombre}</td>
                                            <td>${saldo.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td><strong>Total Ingresos</strong></td>
                                        <td><strong>${estadoResultados.totalIngresos.toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" className="fw-bold">Costos</td>
                                    </tr>
                                    {Object.entries(estadoResultados.costos).map(([nombre, saldo]) => (
                                        <tr key={nombre}>
                                            <td>{nombre}</td>
                                            <td>${saldo.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td><strong>Total Costos</strong></td>
                                        <td><strong>${estadoResultados.totalCostos.toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Utilidad Bruta</strong></td>
                                        <td><strong>${estadoResultados.utilidadBruta.toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" className="fw-bold">Gastos de operación</td>
                                    </tr>
                                    {Object.entries(estadoResultados.gastosGenerales).map(([nombre, saldo]) => (
                                        <tr key={nombre}>
                                            <td>{nombre}</td>
                                            <td>${saldo.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td><strong>Total gastos de operación</strong></td>
                                        <td><strong>${estadoResultados.totalGastosGenerales.toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>{estadoResultados.perdidaPeriodo >= 0 ? 'Utilidad del periodo' : 'Pérdida del periodo'}</strong></td>
                                        <td><strong>${estadoResultados.perdidaPeriodo.toFixed(2)}</strong></td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="table table-bordered mt-1">
                                <tbody>
                                    <tr>
                                        <td className="text-center">
                                            <p><strong>Autorizado por:</strong></p>
                                            <img
                                            src="../../public/firma1.jpg"
                                            alt="Firma de Nuria"
                                            style={{ width: '180px', height: 'auto', marginBottom: '10px' }}
                                            />
                                            <p>Nuria Gonzalez Zuñiga</p>
                                        </td>
                                        <td className="text-center">
                                            <p><strong>Elaborado por:</strong></p>
                                            <img
                                            src="../../public/firma2.jpg"
                                            alt="Firma de Nuria"
                                            style={{ width: '90px', height: 'auto', marginBottom: '10px' }}
                                            />
                                            <p>Citlalli Araceli Hernández Vleeschower</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>             

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EstadoDeResultados;