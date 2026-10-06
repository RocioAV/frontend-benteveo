import { Link } from 'react-router-dom'
import styles from './PreguntasFrecuentes.module.css'

const faqItems = [
  {
    question: '¿Qué es Benteveo?',
    answer: 'Benteveo es una plataforma para explorar herramientas y equipamiento publicados por otras personas, y conocer opciones de alquiler en un mismo lugar.',
  },
  {
    question: '¿Cómo encuentro una herramienta?',
    answer: 'Podés explorar el catálogo, usar el buscador y revisar la información disponible en cada publicación. La disponibilidad y los detalles deben confirmarse antes de avanzar con una reserva.',
  },
  {
    question: '¿Cómo funciona una reserva?',
    answer: 'Elegís una publicación, revisás sus datos y seguís el flujo de reserva que ofrece la plataforma. Las condiciones concretas dependen de la publicación y de la coordinación entre las personas involucradas.',
  },
  {
    question: '¿La ubicación que veo es exacta?',
    answer: 'En esta demo, las ubicaciones son ilustrativas y sirven para mostrar cómo podría funcionar la experiencia. No representan necesariamente la ubicación en tiempo real ni confirman disponibilidad, distancia o punto de entrega.',
  },
  {
    question: '¿Qué hago si tengo una duda sobre una publicación?',
    answer: 'Revisá la descripción y, cuando esté disponible, usá el canal de contacto de la publicación para consultar los detalles directamente con la persona que la ofrece.',
  },
  {
    question: '¿Cómo se procesan los pagos?',
    answer: 'El flujo de pago se muestra dentro de la plataforma cuando corresponde. Antes de confirmar, verificá el resumen de la operación y no compartas los datos de tu tarjeta, contraseñas ni códigos de seguridad por chat.',
  },
]

function PreguntasFrecuentes() {
  return (
    <section className={styles.page} aria-labelledby="faq-title">
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Ayuda para empezar</p>
        <h1 id="faq-title" className={styles.title}>Preguntas frecuentes</h1>
        <p className={styles.intro}>
          Una guía breve para entender cómo funciona Benteveo y qué tener en cuenta al
          explorar una publicación.
        </p>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.faqList}>
          {faqItems.map((item) => (
            <details className={styles.faqItem} key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>

        <aside className={styles.notice} aria-labelledby="faq-notice-title">
          <p className={styles.noticeLabel}>Importante</p>
          <h2 id="faq-notice-title">Asistencia automática</h2>
          <p>
            Algunas respuestas o sugerencias de la plataforma pueden generarse
            automáticamente con inteligencia artificial. Pueden contener errores, no
            reemplazan el soporte humano ni el asesoramiento profesional.
          </p>
          <p>
            No compartas contraseñas, documentos ni datos de pago en conversaciones o
            formularios de asistencia.
          </p>
          <Link className={styles.noticeLink} to="/politicas">
            Leer nuestras políticas
          </Link>
        </aside>
      </div>

      <p className={styles.disclaimer}>
        El contenido de esta página es general e informativo. No constituye asesoramiento
        legal, financiero ni profesional.
      </p>
    </section>
  )
}

export default PreguntasFrecuentes
