import { Component } from 'react'

// ErrorBoundary — captura errores de renderizado de los hijos.
// Sin estilos visuales: muestra un fallback mínimo y loguea error + component stack.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    // Re-render del fallback ante cualquier error de render en el subárbol.
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log del error y del stack de componentes donde ocurrió.
    console.error('ErrorBoundary capturó un error:', error, info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props
      if (fallback) return fallback
      return (
        <div role="alert">
          <p>Algo salió mal. Recargá la página o intentá de nuevo.</p>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary