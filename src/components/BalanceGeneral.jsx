import React, { useState, useEffect } from 'react';
import { getMovimientosPorFecha, getCuentas, getNombreEmpresa } from '../services/api';
import Swal from 'sweetalert2';

const BalanceGeneral = () => {
    const [fechaInicial, setFechaInicial] = useState('');
    const [fechaFinal, setFechaFinal] = useState('');
    const [balance, setBalance] = useState(null);
    const [cuentas, setCuentas] = useState([]);
    const [nombreEmpresa, setNombreEmpresa] = useState('');

    // Cargar cuentas al montar el componente
    useEffect(() => {
        const fetchCuentas = async () => {
            const cuentas = await getCuentas();
            setCuentas(cuentas);
        };
        fetchCuentas();
    }, []);

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

    // Generar el balance general
    const handleGenerarBalance = async () => {
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
            const balanceCalculado = calcularBalance(movimientos);
            setBalance(balanceCalculado);

            // Mostrar alerta de éxito
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'El balance general se ha generado correctamente.',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al generar el balance general.',
            });
        }
    };

    // Calcular el balance general
    const calcularBalance = (movimientos) => {
        const saldos = {};

        // Calcular saldos de cada cuenta
        movimientos.forEach(movimiento => {
            const { cuenta_id, debe, haber } = movimiento;
            if (!saldos[cuenta_id]) {
                saldos[cuenta_id] = 0;
            }
            const cuenta = cuentas.find(c => c.id === parseInt(cuenta_id));
            if (cuenta) {
                if (cuenta.clase === 'activo') {
                    // Activo: debe aumenta, haber disminuye
                    saldos[cuenta_id] += (debe - haber);
                } else if (cuenta.clase === 'pasivo' || cuenta.clase === 'capital contable') {
                    // Pasivo y capital contable: haber aumenta, debe disminuye
                    saldos[cuenta_id] += (haber - debe);
                } else if (cuenta.clase === 'ingresos') {
                    // Ingresos: haber aumenta, debe disminuye
                    saldos[cuenta_id] += (haber - debe);
                } else if (cuenta.clase === 'costos' || cuenta.clase === 'gastos') {
                    // Costos y gastos: debe aumenta, haber disminuye
                    saldos[cuenta_id] += (debe - haber);
                }
            }
        });

        const activoCirculante = {};
        const activoNoCirculante = {};
        const pasivo = {};
        const capital = {};
        const ingresos = {};
        const costos = {};
        const gastosGenerales = {};

        Object.keys(saldos).forEach(cuenta_id => {
            const cuenta = cuentas.find(c => c.id === parseInt(cuenta_id));
            if (cuenta) {
                if (cuenta.clase === 'activo' && cuenta.tipo === 'circulante') {
                    activoCirculante[cuenta.nombre] = saldos[cuenta_id];
                } 
                
                else if (cuenta.clase === 'activo' && cuenta.tipo === 'no circulante' && 
                    !cuenta.nombre.includes('Depreciación acumulada')) {
              activoNoCirculante[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'pasivo') {
                    pasivo[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'capital contable') {
                    capital[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'ingresos') {
                    ingresos[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'costos') {
                    costos[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'gastos') {
                    gastosGenerales[cuenta.nombre] = saldos[cuenta_id];
                }
            }
        });

        // Definir el orden deseado para las cuentas de activo no circulante
        const ordenCuentas = [
            'Terrenos',
            'Edificios',
            'Depreciación acumulada (edificios)',
            'Mobiliario y equipo',
            'Depreciación acumulada (mobiliario y equipo)',
            'Equipo de computo',
            'Depreciación acumulada (equipo de cómputo)'
        ];

        // Crear un objeto ordenado para activo no circulante
        const activoNoCirculanteOrdenado = {};
    
        // Procesar las cuentas en el orden especificado
        ordenCuentas.forEach(nombreCuenta => {
            // Verificar si la cuenta existe en los movimientos del período
            const cuenta = cuentas.find(c => c.nombre === nombreCuenta);
            if (cuenta && saldos[cuenta.id] !== undefined) {
                // Solo agregar si hay saldo (movimientos en el período)
                if (Math.abs(saldos[cuenta.id]) > 0.01) { // Consideramos un pequeño margen para decimales
                    activoNoCirculanteOrdenado[nombreCuenta] = saldos[cuenta.id];
                }
            } else if (activoNoCirculante[nombreCuenta] !== undefined) {
                // Para cuentas que no son depreciaciones pero están en el orden
                activoNoCirculanteOrdenado[nombreCuenta] = activoNoCirculante[nombreCuenta];
            }
        });

        // Agregar cualquier otra cuenta de activo no circulante que no esté en el orden específico
        Object.keys(activoNoCirculante).forEach(nombre => {
            if (!ordenCuentas.includes(nombre) && !activoNoCirculanteOrdenado[nombre]) {
                activoNoCirculanteOrdenado[nombre] = activoNoCirculante[nombre];
            }
        });

        // Calcular totales
        const totalActivoCirculante = Object.values(activoCirculante).reduce((sum, saldo) => sum + saldo, 0);
        const totalActivoNoCirculante = Object.values(activoNoCirculanteOrdenado).reduce((sum, saldo) => sum + saldo, 0);
        const totalActivo = totalActivoCirculante + totalActivoNoCirculante;
        const totalPasivo = Object.values(pasivo).reduce((sum, saldo) => sum + saldo, 0);
        const totalCapital = Object.values(capital).reduce((sum, saldo) => sum + saldo, 0);
        
        const totalIngresos = Object.values(ingresos).reduce((sum, saldo) => sum + saldo, 0);
        const totalCostos = Object.values(costos).reduce((sum, saldo) => sum + saldo, 0);
        const totalGastosGenerales = Object.values(gastosGenerales).reduce((sum, saldo) => sum + saldo, 0);
        const utilidadBruta = totalIngresos - totalCostos;
        const perdidaPeriodo= utilidadBruta-totalGastosGenerales;

        const totalCapitalConPerdida = totalCapital + perdidaPeriodo;
        const totalPasivoMasCapital = totalPasivo + totalCapitalConPerdida;

        return {
            activoCirculante,
            activoNoCirculante: activoNoCirculanteOrdenado,
            pasivo,
            capital,
            totalActivoCirculante,
            totalActivoNoCirculante,
            totalActivo,
            totalPasivo,
            totalCapital: totalCapitalConPerdida,
            totalPasivoMasCapital,
            perdidaPeriodo,
            
        };
    };

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-dark text-white">
                    <h5 className="card-title mb-0">Balance General</h5>
                    <small>Genere el balance general para un período de fechas.</small>
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
                            onClick={handleGenerarBalance}
                        >
                            Generar Balance General
                        </button>
                    </div>

                    {balance && (
                        <div className="mt-4">
                              <h4 className="text-center">{nombreEmpresa}</h4>
                            <h5 className="text-center">Balance General del {fechaInicial} al {fechaFinal}</h5>
                            <div className="row">
                                <div className="col-md-6">
                                    <h6>Activo circulante</h6>
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Cuenta</th>
                                                <th>Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(balance.activoCirculante).map(([nombre, saldo]) => (
                                                <tr key={nombre}>
                                                    <td>{nombre}</td>
                                                    <td>${saldo.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th>Total activo circulante</th>
                                                <th>${balance.totalActivoCirculante.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <h6>Activo no circulante</h6>
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Cuenta</th>
                                                <th>Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(balance.activoNoCirculante).map(([nombre, saldo]) => (
                                                <tr key={nombre}>
                                                    <td>{nombre}</td>
                                                    <td>${saldo.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th>Total activo no circulante</th>
                                                <th>${balance.totalActivoNoCirculante.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                <div className="col-md-6">
                                    <h6>Pasivo</h6>
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Cuenta</th>
                                                <th>Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(balance.pasivo).map(([nombre, saldo]) => (
                                                <tr key={nombre}>
                                                    <td>{nombre}</td>
                                                    <td>${saldo.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th>Total pasivo</th>
                                                <th>${balance.totalPasivo.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <h6>Capital contable</h6>
                                    <table className="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Cuenta</th>
                                                <th>Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(balance.capital).map(([nombre, saldo]) => (
                                                <tr key={nombre}>
                                                    <td>{nombre}</td>
                                                    <td>${saldo.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            <tr>
                                            <td>{balance.perdidaPeriodo >= 0 ? 'Utilidad del periodo' : 'Pérdida del periodo'}</td>
                                            <td>${(balance.perdidaPeriodo).toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th>Total capital</th>
                                                <th>${balance.totalCapital.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className='row'>
                                <div className='col-md-6'>
                                    <h6>Total activo</h6>
                                    <table className="table table-bordered">
                                        <tfoot>
                                            <tr>
                                                <th>Total activo</th>
                                                <th>${balance.totalActivo.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table> 
                                </div>

                                <div className='col-md-6'>
                                    <h6>Total pasivo + Capital</h6>
                                    <table className="table table-bordered">
                                        <tfoot>
                                            <tr>
                                            <th>Total pasivo + Capital</th>
                                            <th>${balance.totalPasivoMasCapital.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table> 
                                </div>
                            </div>       

                            <table className="table table-bordered mt-2">
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

export default BalanceGeneral;