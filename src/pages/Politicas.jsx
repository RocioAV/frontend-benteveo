import { Link } from 'react-router-dom'
import styles from './Politicas.module.css'

function Politicas() {
  return (
    <article className={styles.page} aria-labelledby="policies-title">
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Información y transparencia</p>
        <h1 id="policies-title" className={styles.title}>Políticas y uso de la plataforma</h1>
        <p className={styles.intro}>
          Este resumen explica el alcance de la demo y las pautas generales para usar
          Benteveo con información clara.
        </p>
      </header>

      <div className={styles.notice} role="note">
        <strong>Contenido general e informativo.</strong> Esta página no constituye
        asesoramiento legal, financiero ni profesional. Las condiciones aplicables a una
        operación deben revisarse en la publicación y confirmarse por los canales
        correspondientes antes de avanzar.
      </div>

      <div className={styles.sections}>
        <section className={styles.section} aria-labelledby="platform-use-title">
          <p className={styles.sectionNumber}>01</p>
          <div>
            <h2 id="platform-use-title">Uso de la plataforma</h2>
            <p>
              Benteveo permite explorar publicaciones de herramientas y equipamiento,
              consultar información disponible y, cuando el flujo lo habilita, iniciar
              una reserva. La información de cada publicación debe leerse antes de tomar
              una decisión.
            </p>
            <p>
              La plataforma conecta la oferta con las personas interesadas. Los detalles
              de entrega, retiro, estado del producto, precio y coordinación deben
              confirmarse según cada publicación y operación.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="location-title">
          <p className={styles.sectionNumber}>02</p>
          <div>
            <h2 id="location-title">Ubicación en esta demo</h2>
            <p>
              Las ubicaciones, distancias y referencias geográficas que aparecen en esta
              demo son ilustrativas. Se muestran para representar una posible experiencia
              de búsqueda por cercanía, pero no implican geolocalización en tiempo real,
              exactitud de la dirección ni disponibilidad confirmada.
            </p>
            <p>
              Antes de coordinar un alquiler, verificá el punto de encuentro y los datos
              relevantes directamente en la publicación o con la persona oferente.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="privacy-title">
          <p className={styles.sectionNumber}>03</p>
          <div>
            <h2 id="privacy-title">Privacidad y datos</h2>
            <p>
              Usá la plataforma solo con información necesaria para la experiencia y
              mantené actualizados tus datos cuando corresponda. No publiques ni envíes
              contraseñas, documentos de identidad, códigos de seguridad o datos de
              tarjetas en chats, consultas o descripciones.
            </p>
            <p>
              Si una persona solicita información sensible fuera de un flujo seguro,
              detené la conversación y utilizá los canales oficiales disponibles. La
              información compartida debe limitarse a lo necesario para coordinar la
              consulta o la operación.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="rental-title">
          <p className={styles.sectionNumber}>04</p>
          <div>
            <h2 id="rental-title">Alquiler y cancelación</h2>
            <p>
              Los precios, fechas, condiciones de entrega y responsabilidades pueden
              variar según cada publicación. Revisá el resumen de la operación y cualquier
              condición informada antes de confirmar.
            </p>
            <p>
              Si necesitás cancelar o modificar una solicitud, hacelo por el flujo de la
              plataforma cuando esté disponible y consultá las condiciones mostradas para
              esa operación. Esta página no establece plazos, reintegros ni garantías
              contractuales generales.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.aiSection}`} aria-labelledby="ai-title">
          <p className={styles.sectionNumber}>05</p>
          <div>
            <h2 id="ai-title">Uso de inteligencia artificial</h2>
            <p>
              Algunas respuestas, sugerencias o contenidos de asistencia pueden generarse
              automáticamente mediante inteligencia artificial. Esos resultados pueden
              contener errores, estar incompletos o no reflejar las condiciones más
              recientes de una publicación.
            </p>
            <p>
              La IA no reemplaza el soporte humano ni el asesoramiento legal, financiero
              o profesional. Usá sus respuestas como orientación inicial, verificá la
              información importante y no compartas contraseñas, documentos ni datos de
              pago.
            </p>
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <p>
          ¿Buscás respuestas rápidas? Consultá las{' '}
          <Link to="/preguntas-frecuentes">preguntas frecuentes</Link>.
        </p>
      </footer>
    </article>
  )
}

export default Politicas
