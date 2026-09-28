import PagoRetorno from '../components/PagoRetorno.jsx'

// back_urls.pending de Mercado Pago: redirige al perfil con countdown.
function PagoPendiente() {
  return <PagoRetorno type="pending" />
}

export default PagoPendiente
