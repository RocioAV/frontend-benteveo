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
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const daysOfRent =
      startDate && endDate && endDate > startDate
        ? Math.ceil((end - start) / MS_PER_DAY)
        : 0;
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
          </label>

          <div className="reservation-summary">
            <p>Precio por día: ${product.pricePerDay}</p>
            <p>Días: {daysOfRent}</p>
            <p>Depósito: ${product.deposit}</p>
            <p>Total: {totalPrice}</p>
          </div>

          <button type="button">Confirmar reserva</button>
        </form>
      </div>
    </section>
  )
}

export default Reservation