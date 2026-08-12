import './reservation.css'
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import products from '../data/products.json';

const Reservation = ({ product: productProp }) => {
    const { id } = useParams();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [submission, setSubmission] = useState(null);
    const product = productProp ?? products.find((p) => p.id === Number(id));
    const start = new Date(startDate);
    const end = new Date(endDate);
    const hasInvalidDateRange = startDate && endDate && endDate <= startDate;
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysOfRent =
    startDate && endDate && !hasInvalidDateRange
      ? Math.ceil((end - start) / MS_PER_DAY)
      : 0;
    if (!product) {
      return <h1>Producto no encontrado</h1>;
    }
    const totalPrice =
      daysOfRent > 0
        ? product.deposit + daysOfRent * product.pricePerDay
        : 0;

    const today = new Date();
    const minDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    const handleConfirm = (event) => {
      event.preventDefault();
      if (!startDate || !endDate || startDate < minDate || endDate <= startDate) {
        setSubmission('error');
        return;
      }
      localStorage.setItem(
        'bv:reservation',
        JSON.stringify({ productId: product.id, startDate, endDate })
      );
      setSubmission('success');
    };

  return (
    <section className="reservation-page">
      <div className="reservation-card">
        <h1>Reservar {product.title} en {product.city}</h1>

        <form className="reservation-form" onSubmit={handleConfirm}>
          <label htmlFor="fecha-inicio">Fecha de inicio</label>
          <input
            type="date"
            id="fecha-inicio"
            name="fecha-inicio"
            min={minDate}
            required
            onChange={(event) => setStartDate(event.target.value)}
          />

          <label htmlFor="fecha-fin">Fecha de fin</label>
          <input
            type="date"
            id="fecha-fin"
            name="fecha-fin"
            min={minDate}
            required
            onChange={(event) => setEndDate(event.target.value)}
          />
          {hasInvalidDateRange && (
            <p className="reservation-error" role="alert">
              La fecha de fin debe ser posterior a la fecha de inicio.
            </p>
          )}

          <div className="reservation-summary">
            <p><span>Precio por día</span><strong>${product.pricePerDay.toLocaleString('es-AR')}</strong></p>
            <p><span>Días</span><strong>{daysOfRent}</strong></p>
            <p><span>Depósito</span><strong>${product.deposit.toLocaleString('es-AR')}</strong></p>
            <p><span>Total</span><strong>${totalPrice.toLocaleString('es-AR')}</strong></p>
          </div>

          {submission === 'error' && (
            <p className="reservation-error" role="alert">
              Completá las fechas correctamente: la fecha de inicio no puede ser anterior a hoy y la fecha de fin debe ser posterior a la de inicio.
            </p>
          )}
          {submission === 'success' && (
            <p className="reservation-success" role="status">
              ¡Reserva confirmada! Guardamos tu reserva del {startDate} al {endDate}.
            </p>
          )}

          <button type="submit">
            Confirmar reserva
          </button>
        </form>
      </div>
    </section>
  )
}

export default Reservation