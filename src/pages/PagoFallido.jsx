import PagoRetorno from '../components/PagoRetorno.jsx'

// back_urls.failure de Mercado Pago: redirige al perfil con countdown.
function PagoFallido() {
  return <PagoRetorno type="failure" />
}

export default PagoFallido
