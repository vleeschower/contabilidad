import React, { useState, useEffect } from 'react';
import { getCuentas, createMovimiento, getUltimoNumeroMovimiento } from '../services/api';
import Swal from 'sweetalert2';

const MovimientosRegulares = () => {
    const [cuentas, setCuentas] = useState([]);
    const [items, setItems] = useState([{ cuentaId: '', monto: 0, tipo: 'debe' }]);
    const [fecha, setFecha] = useState(''); 
    const [descripcion, setDescripcion] = useState(''); 
    const [mensaje, setMensaje] = useState(''); 
    const [numeroMovimiento, setNumeroMovimiento] = useState(2);

    // Cargar cuentas y obtener el último número de movimiento al montar el componente
    useEffect(() => {
        const fetchCuentas = async () => {
            const cuentas = await getCuentas();
            setCuentas(cuentas);
        };
        fetchCuentas();

        const fetchUltimoNumeroMovimiento = async () => {
            const ultimoNumero = await getUltimoNumeroMovimiento();
            if (ultimoNumero) {
                setNumeroMovimiento(ultimoNumero + 1); // Incrementar el último número de movimiento
            }
        };
        fetchUltimoNumeroMovimiento();
    }, []);

    // Manejar cambios en los campos del formulario
    const handleCuentaChange = (index, event) => {
        const newItems = [...items];
        newItems[index].cuentaId = event.target.value;
        setItems(newItems);
    };

    const handleMontoChange = (index, event) => {
        const newItems = [...items];
        newItems[index].monto = parseFloat(event.target.value);
        setItems(newItems);
    };

    const handleTipoChange = (index, event) => {
        const newItems = [...items];
        newItems[index].tipo = event.target.value;
        setItems(newItems);
    };

    const handleFechaChange = (event) => {
        setFecha(event.target.value);
    };

    const handleDescripcionChange = (event) => {
        setDescripcion(event.target.value);
    };

    // Agregar una nueva fila de cuenta y monto
    const agregarFila = () => {
        setItems([...items, { cuentaId: '', monto: 0, tipo: 'debe' }]);
    };

    // Calcular las sumas de "debe" y "haber"
    const calcularSumas = () => {
        let sumaDebe = 0;
        let sumaHaber = 0;

        items.forEach(item => {
            if (item.tipo === 'debe') {
                sumaDebe += item.monto;
            } else {
                sumaHaber += item.monto;
            }
        });

        return { sumaDebe, sumaHaber };
    };

    // Registrar los movimientos
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar que todos los campos estén completos
        if (!fecha || !descripcion || items.some(item => !item.cuentaId || item.monto <= 0)) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, complete todos los campos correctamente.',
            });
            return;
        }

        // Calcular las sumas de "debe" y "haber"
        const { sumaDebe, sumaHaber } = calcularSumas();

        // Validar que las sumas sean iguales
        if (sumaDebe !== sumaHaber) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Las sumas de "debe" y "haber" no cuadran. Por favor, revise los montos.',
            });
            return;
        }

        // Crear movimientos para cada item
        try {
            for (const item of items) {
                await createMovimiento({
                    cuenta_id: item.cuentaId,
                    fecha: fecha,
                    descripcion: descripcion,
                    debe: item.tipo === 'debe' ? item.monto : 0,
                    haber: item.tipo === 'haber' ? item.monto : 0,
                    numero_movimiento: numeroMovimiento
                });
            }
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: `Movimientos registrados con éxito.`,
            });
            setItems([{ cuentaId: '', monto: 0, tipo: 'debe' }]); // Reiniciar el formulario
            setFecha('');
            setDescripcion('');
            setNumeroMovimiento(numeroMovimiento + 1);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al registrar los movimientos.',
            });
        }
    };

    // Calcular las sumas de "debe" y "haber"
    const { sumaDebe, sumaHaber } = calcularSumas();

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-dark text-white">
                    <h5 className="card-title mb-0">Movimientos Regulares</h5>
                    <small>Registre los movimientos contables de su negocio.</small>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
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
                        <div className="mb-3">
                            <label htmlFor="descripcion" className="form-label">Descripción</label>
                            <input
                                type="text"
                                className="form-control"
                                id="descripcion"
                                placeholder="Descripción del movimiento"
                                value={descripcion}
                                onChange={handleDescripcionChange}
                                required
                            />
                        </div>
                        {items.map((item, index) => (
                            <div key={index} className="row g-2 mb-3">
                                <div className="col-12 col-md-5">
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
                                <div className="col-12 col-md-3">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Monto"
                                        value={item.monto}
                                        onChange={(e) => handleMontoChange(index, e)}
                                        required
                                    />
                                </div>
                                <div className="col-12 col-md-2">
                                    <select
                                        className="form-select"
                                        value={item.tipo}
                                        onChange={(e) => handleTipoChange(index, e)}
                                        required
                                    >
                                        <option value="debe">Debe</option>
                                        <option value="haber">Haber</option>
                                    </select>
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
                            <strong>Total Debe: </strong> {sumaDebe.toFixed(2)}
                        </div>
                        <div className="mb-3">
                            <strong>Total Haber: </strong> {sumaHaber.toFixed(2)}
                        </div>
                        <div className="d-grid">
                            <button type="submit" className="btn btn-primary">
                                Registrar Movimientos
                            </button>
                        </div>
                    </form>
                    {mensaje && <p className="mt-3">{mensaje}</p>}
                </div>
            </div>
        </div>
    );
};

export default MovimientosRegulares;