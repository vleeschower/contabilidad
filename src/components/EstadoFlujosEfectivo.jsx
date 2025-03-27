import React, { useState, useEffect } from 'react';
import { getMovimientosPorFecha, getCuentas, getNombreEmpresa } from '../services/api';
import Swal from 'sweetalert2';

const EstadoFlujosEfectivo = () => {
    const [fechaInicial, setFechaInicial] = useState('');
    const [fechaFinal, setFechaFinal] = useState('');
    const [cuentas, setCuentas] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [nombreEmpresa, setNombreEmpresa] = useState('');
    const [perdidaUtilidad, setPerdidaUtilidad] = useState(0);

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

    // Calcular la pérdida o utilidad del periodo
    const calcularPerdidaUtilidad = (movimientos) => {
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
        const perdidaUtilidad = utilidadBruta - totalGastosGenerales;

        return perdidaUtilidad;
    };

    // Generar el estado de flujos de efectivo
    const handleGenerarReporte = async () => {
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
            
            // Calcular pérdida/ganancia del periodo
            const perdidaUtilidad = calcularPerdidaUtilidad(movimientos);
            setPerdidaUtilidad(perdidaUtilidad);

            // Mostrar alerta de éxito
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'El estado de flujos de efectivo se ha generado correctamente.',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al generar el estado de flujos de efectivo.',
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

    // Clasificar cuentas por categoría para el estado de flujos
    const clasificarCuentas = (totalesPorCuenta) => {
        const aplicacionEfectivo = ['Clientes', 'Mercancias', 'IVA acreditable', 'IVA por acreditar', 
                                    'Renta pagada por anticipado', 'Papeleria', 'IVA trasladado', 
                                    'IVA por trasladar', 'Mobiliario y equipo', 'Terrenos', 'Edificios', 'Equipo de computo'];
        
        const pasivo = ['Acreedores', 'Documentos por pagar', 'Capital social'];
                            
        const depreciaciones = ['Depreciación acumulada (edificios)', 'Depreciación acumulada (equipo de cómputo)', 'Depreciación acumulada (mobiliario y equipo)']
        
        const efectivo = ['Bancos', 'Caja'];

        const clasificadas = {
            efectivoAplicacion: [],
            pasivo: [],
            depreciaciones: [],
            efectivo: [],
        };

        Object.entries(totalesPorCuenta).forEach(([cuentaId, totales]) => {
            const nombreCuenta = obtenerNombreCuenta(cuentaId);
            const saldo = calcularSaldo(totales.debe, totales.haber);

            if (aplicacionEfectivo.includes(nombreCuenta)) {
                clasificadas.efectivoAplicacion.push({ nombre: nombreCuenta, saldo });
            } else if (pasivo.includes(nombreCuenta)) {
                clasificadas.pasivo.push({ nombre: nombreCuenta, saldo });
            } else if (depreciaciones.includes(nombreCuenta)) {
                clasificadas.depreciaciones.push({ nombre: nombreCuenta, saldo });
            } else if (efectivo.includes(nombreCuenta)) {
                clasificadas.efectivo.push({ nombre: nombreCuenta, saldo });
            }
        });

        return clasificadas;
    };

    const totalesPorCuenta = calcularTotalesPorCuenta(movimientos);
    const cuentasClasificadas = clasificarCuentas(totalesPorCuenta);

    // Calcular totales por categoría
    const totalEfectivo = cuentasClasificadas.efectivoAplicacion.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
    const totalPasivo = cuentasClasificadas.pasivo.reduce((sum, cuenta) => sum + cuenta.saldo, 0)*-1;
    const totalDepreciaciones = cuentasClasificadas.depreciaciones.reduce((sum, cuenta) => sum + cuenta.saldo, 0)*-1;

    // Obtener saldos de efectivo
    const bancos = cuentasClasificadas.efectivo.find(c => c.nombre === 'Bancos')?.saldo || 0;
    const caja = cuentasClasificadas.efectivo.find(c => c.nombre === 'Caja')?.saldo || 0;

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-dark text-white">
                    <h5 className="card-title mb-0">Estado de Flujos de Efectivo</h5>
                    <small>Genere el estado de flujos de efectivo para un período de fechas.</small>
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
                            onClick={handleGenerarReporte}
                        >
                            Generar Estado de Flujos de Efectivo
                        </button>
                    </div>

                    {movimientos.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-center">{nombreEmpresa}</h4>
                            <h5 className="text-center">Estado de Flujos de Efectivo del {fechaInicial} al {fechaFinal}</h5>
                            
                            <table className="table table-bordered">
                                <thead>
                                    <tr className='text-center'>
                                        <th colSpan="3">Fuentes de efectivo:</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{perdidaUtilidad >= 0 ? 'Utilidad del periodo' : 'Pérdida del periodo'}</td>
                                        <td></td>
                                        <td className="text-end">${perdidaUtilidad.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="3">Cargos a resultados que no implican utilización de efectivo:</td>
                                    </tr>
                                    <tr>
                                        <td>Provisión de ISR</td>
                                        <td className='text-end'>${0.00.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>Provisión PTU</td>
                                        <td className='text-end'>${0.00.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>Depreciaciones</td>
                                        <td className="text-end">${(totalDepreciaciones).toFixed(2)}</td>
                                        <td className="text-end">${(totalDepreciaciones).toFixed(2)}</td>
                                    </tr>
                                    <tr className="fw-bold">
                                        <td colSpan="2">Efectivo generado en la operación</td>
                                        <td className="text-end">${(totalDepreciaciones + perdidaUtilidad).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="3">Financiamiento y otras fuentes:</td>
                                    </tr>
                                    {cuentasClasificadas.pasivo.map((cuenta, index) => (
                                        <tr key={`pasivo-${index}`}>
                                            <td>{cuenta.nombre}</td>
                                            <td className="text-end">${Math.abs(cuenta.saldo).toFixed(2)}</td>
                                            {index === cuentasClasificadas.pasivo.length - 1 ? (
                                                <td className="text-end">${(totalPasivo).toFixed(2)}</td>
                                            ):(
                                                <td></td>

                                            )}
                                        </tr>
                                    ))}
                                    <tr className="fw-bold">
                                        <td colSpan="2">Suma de las fuentes de efectivo</td>
                                        <td className="text-end">${(totalDepreciaciones + perdidaUtilidad + totalPasivo).toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <table className="table table-bordered mt-4">
                                <thead>
                                    <tr className='text-center'>
                                        <th colSpan="3">Aplicación efectivo:</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cuentasClasificadas.efectivoAplicacion.map((cuenta, index) => (
                                        <tr key={`efectivoAplicacion-${index}`}>
                                            <td>{cuenta.nombre}</td>
                                            <td className="text-end">${cuenta.saldo.toFixed(2)}</td>
                                            {index === cuentasClasificadas.efectivoAplicacion.length - 1 ? (
                                                <td className="text-end">${(totalEfectivo).toFixed(2)}</td>
                                            ):(
                                                <td></td>

                                            )}
                                        </tr>
                                    ))}
                                    <tr className="fw-bold">
                                        <td colSpan="2">Disminución neta del efectivo</td>
                                        <td className="text-end">${(totalDepreciaciones + perdidaUtilidad + totalPasivo - totalEfectivo).toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td>Saldo inicial de bancos</td>
                                        <td className='text-end'>${100000.00.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>Saldo final de bancos</td>
                                        <td className="text-end">${bancos.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>Saldo inicial de caja</td>
                                        <td className='text-end'>${50000.00.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td>Saldo final de caja</td>
                                        <td className="text-end">${caja.toFixed(2)}</td>
                                        <td></td>
                                    </tr>
                                    <tr className="fw-bold">
                                        <td colSpan="2">Suma de saldos finales en caja y bancos</td>
                                        <td className="text-end">${(caja+ bancos).toFixed(2)}</td>
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

export default EstadoFlujosEfectivo;