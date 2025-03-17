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
                }
            }
        });

        const activoCirculante = {};
        const activoNoCirculante = {};
        const pasivo = {};
        const capital = {};

        Object.keys(saldos).forEach(cuenta_id => {
            const cuenta = cuentas.find(c => c.id === parseInt(cuenta_id));
            if (cuenta) {
                if (cuenta.clase === 'activo' && cuenta.tipo === 'circulante') {
                    activoCirculante[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'activo' && cuenta.tipo === 'no circulante') {
                    activoNoCirculante[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'pasivo') {
                    pasivo[cuenta.nombre] = saldos[cuenta_id];
                } else if (cuenta.clase === 'capital contable') {
                    capital[cuenta.nombre] = saldos[cuenta_id];
                }
            }
        });

        // Calcular totales
        const totalActivoCirculante = Object.values(activoCirculante).reduce((sum, saldo) => sum + saldo, 0);
        const totalActivoNoCirculante = Object.values(activoNoCirculante).reduce((sum, saldo) => sum + saldo, 0);
        const totalActivo = totalActivoCirculante + totalActivoNoCirculante;
        const totalPasivo = Object.values(pasivo).reduce((sum, saldo) => sum + saldo, 0);
        const totalCapital = Object.values(capital).reduce((sum, saldo) => sum + saldo, 0);
        const totalPasivoMasCapital = totalPasivo + totalCapital;

        return {
            activoCirculante,
            activoNoCirculante,
            pasivo,
            capital,
            totalActivoCirculante,
            totalActivoNoCirculante,
            totalActivo,
            totalPasivo,
            totalCapital,
            totalPasivoMasCapital
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
                                    <h6>Activo Circulante</h6>
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
                                                <th>Total Activo Circulante</th>
                                                <th>${balance.totalActivoCirculante.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <h6>Activo No Circulante</h6>
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
                                                <th>Total Activo No Circulante</th>
                                                <th>${balance.totalActivoNoCirculante.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <h6>Total Activo</h6>
                                    <table className="table table-bordered">
                                        <tfoot>
                                            <tr>
                                                <th>Total Activo</th>
                                                <th>${balance.totalActivo.toFixed(2)}</th>
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
                                                <th>Total Pasivo</th>
                                                <th>${balance.totalPasivo.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <h6>Capital Contable</h6>
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
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <th>Total Capital</th>
                                                <th>${balance.totalCapital.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <h6>Total Pasivo + Capital</h6>
                                    <table className="table table-bordered">
                                        <tfoot>
                                            <tr>
                                                <th>Total Pasivo + Capital</th>
                                                <th>${balance.totalPasivoMasCapital.toFixed(2)}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BalanceGeneral;