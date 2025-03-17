import React, { useState, useEffect } from 'react';
import { getCuentas, createMovimiento, getAsientoApertura, guardarNombreEmpresa } from '../services/api';
import Swal from 'sweetalert2';

const AsientoApertura = () => {
    const [cuentas, setCuentas] = useState([]);
    const [asientoExistente, setAsientoExistente] = useState(null);
    const [items, setItems] = useState([{ cuentaId: '', monto: 0 }]);
    const [fecha, setFecha] = useState('');
    const [nombreEmpresa, setNombreEmpresa] = useState('');
    const [totalDebe, setTotalDebe] = useState(0);
    const [totalHaber, setTotalHaber] = useState(0);

    // Cargar cuentas y verificar si ya existe un asiento de apertura
    useEffect(() => {
        const fetchCuentas = async () => {
            const cuentas = await getCuentas();
            setCuentas(cuentas);
        };
        fetchCuentas();

        const fetchAsientoApertura = async () => {
            const asiento = await getAsientoApertura();
            if (asiento) {
                setAsientoExistente(asiento);
            }
        };
        fetchAsientoApertura();
    }, []);

    // Calcular los totales de "debe" y "haber"
    const calcularTotales = (items) => {
        let debe = 0;
        let haber = 0;

        items.forEach((item) => {
            const cuenta = cuentas.find((c) => c.id === parseInt(item.cuentaId));
            if (cuenta) {
                if (cuenta.clase === 'activo') {
                    debe += item.monto; // Activo va en debe
                } else if (cuenta.clase === 'pasivo' || cuenta.clase === 'capital contable') {
                    haber += item.monto; // Pasivo y capital contable van en haber
                }
            }
        });

        setTotalDebe(debe);
        setTotalHaber(haber);
    };

    // Manejar cambios en los campos del formulario
    const handleCuentaChange = (index, event) => {
        const newItems = [...items];
        newItems[index].cuentaId = event.target.value;
        setItems(newItems);
        calcularTotales(newItems); // Recalcular totales
    };

    const handleMontoChange = (index, event) => {
        const newItems = [...items];
        newItems[index].monto = parseFloat(event.target.value);
        setItems(newItems);
        calcularTotales(newItems); // Recalcular totales
    };

    const handleFechaChange = (event) => {
        setFecha(event.target.value);
    };

    const handleNombreEmpresaChange = (event) => {
        setNombreEmpresa(event.target.value);
    };

    // Agregar una nueva fila de cuenta y monto
    const agregarFila = () => {
        const newItems = [...items, { cuentaId: '', monto: 0 }];
        setItems(newItems);
        calcularTotales(newItems); // Recalcular totales
    };

    // Registrar el asiento de apertura
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar que todos los campos estén completos
        if (!fecha) {
            Swal.fire('Error', 'Por favor, ingrese la fecha.', 'error');
            return;
        }

        if (items.some(item => !item.cuentaId || item.monto <= 0)) {
            Swal.fire('Error', 'Por favor, complete todos los campos correctamente.', 'error');
            return;
        }

        // Validar que las sumas de debe y haber cuadren
        if (totalDebe !== totalHaber) {
            Swal.fire('Error', 'Las sumas de "debe" y "haber" no cuadran. Por favor, revise los montos.', 'error');
            return;
        }

        // Guardar el nombre de la empresa en la base de datos
        try {
            await guardarNombreEmpresa({ nombre: nombreEmpresa });

            // Crear movimientos para cada item
            for (const item of items) {
                const cuenta = cuentas.find((c) => c.id === parseInt(item.cuentaId));
                if (cuenta) {
                    await createMovimiento({
                        cuenta_id: item.cuentaId,
                        fecha: fecha,
                        descripcion: 'Asiento de Apertura',
                        debe: cuenta.clase === 'activo' ? item.monto : 0,
                        haber: cuenta.clase === 'pasivo' || cuenta.clase === 'capital contable' ? item.monto : 0,
                        numero_movimiento: 1,
                    });
                }
            }

            Swal.fire('Éxito', 'Asiento de apertura registrado con éxito.', 'success');
            setAsientoExistente(true);
        } catch (error) {
            Swal.fire('Error', 'Error al registrar el asiento de apertura.', 'error');
        }
    };

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-dark text-white">
                    <h5 className="card-title mb-0">Asiento de Apertura</h5>
                    <small>El asiento de apertura solo se realiza una vez al inicio de las operaciones.</small>
                </div>
                <div className="card-body">
                    {asientoExistente ? (
                        <div className="alert alert-info">
                            El asiento de apertura ya ha sido registrado.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="nombreEmpresa" className="form-label">Nombre de la Empresa</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="nombreEmpresa"
                                    value={nombreEmpresa}
                                    onChange={handleNombreEmpresaChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="fecha" className="form-label">Fecha</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    id="fecha"
                                    value={fecha}
                                    onChange={handleFechaChange}
                                    required
                                />
                            </div>
                            {items.map((item, index) => (
                                <div key={index} className="row g-2 mb-3">
                                    <div className="col-12 col-md-6">
                                        <select
                                            className="form-select"
                                            value={item.cuentaId}
                                            onChange={(e) => handleCuentaChange(index, e)}
                                            required
                                        >
                                            <option value="">Seleccione una cuenta</option>
                                            {cuentas.map(cuenta => (
                                                <option key={cuenta.id} value={cuenta.id}>
                                                    {cuenta.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-12 col-md-4">
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Monto"
                                            value={item.monto}
                                            onChange={(e) => handleMontoChange(index, e)}
                                            required
                                        />
                                    </div>
                                    <div className="col-12 col-md-2 d-flex justify-content-center align-items-center">
                                        {index === items.length - 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-success"
                                                onClick={agregarFila}
                                            >
                                                +
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="mb-3">
                                <strong>Total Debe: </strong> {totalDebe.toFixed(2)}
                            </div>
                            <div className="mb-3">
                                <strong>Total Haber: </strong> {totalHaber.toFixed(2)}
                            </div>
                            <div className="d-grid">
                                <button type="submit" className="btn btn-primary">
                                    Registrar Asiento de Apertura
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AsientoApertura;