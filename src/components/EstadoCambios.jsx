import React, { useState, useEffect } from 'react';
import { getMovimientosPorFecha, getCuentas, getNombreEmpresa } from '../services/api';
import Swal from 'sweetalert2';

const EstadoCambiosCapitalContable = () => {
    const [fechaInicial, setFechaInicial] = useState('');
    const [fechaFinal, setFechaFinal] = useState('');
    const [estadoCapital, setEstadoCapital] = useState(null);
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

    // Generar el estado de cambios en el capital contable
    const handleGenerarEstadoCapital = async () => {
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
            const estadoCalculado = calcularEstadoCapital(movimientos);
            setEstadoCapital(estadoCalculado);

            // Mostrar alerta de éxito
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'El estado de cambios en el capital contable se ha generado correctamente.',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al generar el estado de cambios en el capital contable.',
            });
        }
    };

    // Calcular el estado de cambios en el capital contable
    const calcularEstadoCapital = (movimientos) => {
        const saldos = {};

        // Calcular saldos de cada cuenta
        movimientos.forEach(movimiento => {
            const { cuenta_id, debe, haber } = movimiento;
            if (!saldos[cuenta_id]) {
                saldos[cuenta_id] = 0;
            }
            const cuenta = cuentas.find(c => c.id === parseInt(cuenta_id));
            if (cuenta) {
                if (cuenta.clase === 'capital contable') {
                    // Capital contable: haber aumenta, debe disminuye
                    saldos[cuenta_id] += (haber - debe);
                }else if (cuenta.clase === 'ingresos') {
                    // Ingresos: haber aumenta, debe disminuye
                    saldos[cuenta_id] += (haber - debe);
                } else if (cuenta.clase === 'costos' || cuenta.clase === 'gastos') {
                    // Costos y gastos: debe aumenta, haber disminuye
                    saldos[cuenta_id] += (debe - haber);
                }
            }
        });

        const capitalInicial = {};
        const capital = {};
        const ingresos = {};
        const costos = {};
        const gastosGenerales = {};


        Object.keys(saldos).forEach(cuenta_id => {
            const cuenta = cuentas.find(c => c.id === parseInt(cuenta_id));
            if (cuenta) {
                if (cuenta.tipo === 'capital inicial') {
                    capitalInicial[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'capital contable') {
                    capital[cuenta.nombre] = saldos[cuenta_id];
                }else if (cuenta.clase === 'ingresos') {
                    ingresos[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'costos') {
                    costos[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'gastos') {
                    gastosGenerales[cuenta.nombre] = saldos[cuenta_id];
                }
            }
        });

        // Calcular totales
        const totalCapitalInicial = Object.values(capitalInicial).reduce((sum, saldo) => sum + saldo, 0);
        const totalCapital = Object.values(capital).reduce((sum, saldo) => sum + saldo, 0);
        const totalIngresos = Object.values(ingresos).reduce((sum, saldo) => sum + saldo, 0);
        const totalCostos = Object.values(costos).reduce((sum, saldo) => sum + saldo, 0);
        const totalGastosGenerales = Object.values(gastosGenerales).reduce((sum, saldo) => sum + saldo, 0);
        const utilidadBruta = totalIngresos - totalCostos;
        const perdidaPeriodo= utilidadBruta-totalGastosGenerales;
        const reservaLegal = ((perdidaPeriodo*0.05)/12);

        return {
            capitalInicial,
            totalCapital,
            totalCapitalInicial,
            ingresos,
            costos,
            gastosGenerales,
            totalIngresos,
            totalCostos,
            totalGastosGenerales,
            utilidadBruta,
            perdidaPeriodo,
            reservaLegal
        };
    };

    // Calcular totales de las columnas
    const calcularTotalesColumnas = () => {
        if (!estadoCapital) return { totalContribuido: 0, totalGanado: 0, totalContable: 0 };

        const totalContribuido = estadoCapital.totalCapitalInicial + estadoCapital.totalCapital;
        const totalGanado = estadoCapital.totalCapitalInicial + estadoCapital.reservaLegal + estadoCapital.perdidaPeriodo;
        const totalContable = estadoCapital.totalCapitalInicial + estadoCapital.totalCapital + estadoCapital.reservaLegal + estadoCapital.perdidaPeriodo;
        const totalGanado2=totalGanado-estadoCapital.reservaLegal;
        const totalContable2=totalContable-estadoCapital.reservaLegal;

        return { totalContribuido, totalGanado, totalContable, totalGanado2, totalContable2 };
    };

    const { totalContribuido, totalGanado, totalContable, totalGanado2, totalContable2 } = calcularTotalesColumnas();

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-dark text-white">
                    <h5 className="card-title mb-0">Estado de Cambios en el Capital Contable</h5>
                    <small>Genere el estado de cambios en el capital contable para un período de fechas.</small>
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
                            onClick={handleGenerarEstadoCapital}
                        >
                            Generar Estado de Cambios en el Capital Contable
                        </button>
                    </div>

                    {estadoCapital && (
                        <div className="mt-4">
                            <h4 className="text-center">{nombreEmpresa}</h4>
                            <h5 className="text-center">Estado de Cambios en el Capital Contable del {fechaInicial} al {fechaFinal}</h5>
                            <table className="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>Concepto</th>
                                        <th>Capital contribuido</th>
                                        <th>Capital ganado</th>
                                        <th>Capital contable</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Saldo inicial*/}
                                    {Object.entries(estadoCapital.capitalInicial).map(([nombre, saldo]) => (
                                        <tr key={nombre}>
                                            <td>{nombre}</td>
                                            <td>${saldo.toFixed(2)}</td>
                                            <td>${saldo.toFixed(2)}</td>
                                            <td>${saldo.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td>Saldo inicial</td>
                                        <td>${estadoCapital.totalCapitalInicial.toFixed(2)}</td>
                                        <td>${estadoCapital.totalCapitalInicial.toFixed(2)}</td>
                                        <td>${estadoCapital.totalCapitalInicial.toFixed(2)}</td>
                                    </tr>

                                    <tr>
                                        <td colSpan="4" className="fw-bold">Aumentos</td>
                                    </tr>
                                    <tr>
                                        <td>Capital social</td>
                                        <td>${estadoCapital.totalCapital.toFixed(2)}</td>
                                        <td>$0.00</td>
                                        <td>${estadoCapital.totalCapital.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Reselva legal</td>
                                        <td>$0.00</td>
                                        <td>${estadoCapital.reservaLegal.toFixed(2)}</td>
                                        <td>${estadoCapital.reservaLegal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Emisiones de acciones</td>
                                        <td>$0.00</td>
                                        <td>$0.00</td>
                                        <td>$0.00</td>
                                    </tr>
                                    <tr>
                                        <td>Primas de acicones</td>
                                        <td>$0.00</td>
                                        <td>$0.00</td>
                                        <td>$0.00</td>
                                    </tr>
                                    <tr>
                                        <td>Resultados del ejercicio</td>
                                        <td>$0.00</td>
                                        <td>${estadoCapital.perdidaPeriodo.toFixed(2)}</td>
                                        <td>${estadoCapital.perdidaPeriodo.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Totales</strong></td>
                                        <td><strong>${totalContribuido.toFixed(2)}</strong></td>
                                        <td><strong>${totalGanado.toFixed(2)}</strong></td>
                                        <td><strong>${totalContable.toFixed(2)}</strong></td>
                                    </tr>
                                    <tr>
                                        <td colSpan="4" className="fw-bold">Disminuciones</td>
                                    </tr>
                                    <tr>
                                        <td>Decretos de dividendo</td>
                                        <td>$0.00</td>
                                        <td>$0.00</td>
                                        <td>$0.00</td>
                                    </tr>
                                    <tr>
                                        <td>Reselva legal</td>
                                        <td>$0.00</td>
                                        <td>${estadoCapital.reservaLegal.toFixed(2)}</td>
                                        <td>${estadoCapital.reservaLegal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Reembolso a socios</td>
                                        <td>$0.00</td>
                                        <td>$0.00</td>
                                        <td>$0.00</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Totales</strong></td>
                                        <td><strong>${totalContribuido.toFixed(2)}</strong></td>
                                        <td><strong>${totalGanado2.toFixed(2)}</strong></td>
                                        <td><strong>${totalContable2.toFixed(2)}</strong></td>
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

export default EstadoCambiosCapitalContable;