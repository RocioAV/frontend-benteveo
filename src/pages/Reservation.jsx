import './reservation.css'
import products from "../data/products.json";
import { useState } from 'react';
import { useParams } from 'react-router-dom';

const Reservation = () => {
    const { id } = useParams();
    const productId = Number(id);
    const product = products.find(product => product.id === productId);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const start = new Date(startDate);
    const end = new Date(endDate);
    const hasInvalidDateRange = startDate && endDate && endDate <= startDate;
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysOfRent =
    startDate && endDate && !hasInvalidDateRange
      ? Math.ceil((end - start) / MS_PER_DAY)
      : 0;
    if (!product) {
      return <h2>Producto no encontrado</h2>;
    }
    const totalPrice =
      daysOfRent > 0
        ? product.deposit + daysOfRent * product.pricePerDay
        : 0;

  return (
    <section className="reservation-page">
      <div className="reservation-card">
        <h1>Reservar {product.name} en {product.city}</h1>

        <form className="reservation-form">
          <label>
            Fecha de inicio
            <input type="date" onChange={(event) => setStartDate(event.target.value)}/>
          </label>

          <label>
            Fecha de fin
            <input type="date" onChange={(event) => setEndDate(event.target.value)}/>
            {hasInvalidDateRange && (
              <p className="reservation-error">
                La fecha de fin debe ser posterior a la fecha de inicio.
              </p>
            )}
          </label>

          <div className="reservation-summary">
            <p><span>Precio por día</span><strong>${product.pricePerDay}</strong></p>
            <p><span>Días</span><strong>{daysOfRent}</strong></p>
            <p><span>Depósito</span><strong>${product.deposit}</strong></p>
            <p><span>Total</span><strong>${totalPrice}</strong></p>
          </div>

          <button
            type="button"
            disabled={!startDate || !endDate || hasInvalidDateRange}>
            Confirmar reserva
          </button>
        </form>
      </div>
    </section>
  )
}

export default Reservation