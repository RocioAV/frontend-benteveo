import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RatingModal from './RatingModal.jsx'

afterEach(() => {
  vi.useRealTimers()
})

async function chooseStars(count) {
  const user = userEvent.setup()
  const buttons = await screen.findAllByRole('radio')
  await user.click(buttons[count - 1])
  return user
}

describe('RatingModal — modo solo-estrellas (usuarios)', () => {
  it('oculta el comentario y envía solo `{ rating }`', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <RatingModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        objectName="Juan Pérez"
        commentEnabled={false}
      />,
    )

    expect(screen.queryByLabelText(/comentario/i)).not.toBeInTheDocument()

    const user = await chooseStars(5)
    await user.click(screen.getByRole('button', { name: /enviar calificación/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({ rating: 5 })
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('comment')
  })

  it('cerrar o "Ahora no" nunca envía la calificación', async () => {
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    render(
      <RatingModal isOpen onClose={onClose} onSubmit={onSubmit} commentEnabled={false} />,
    )

    await chooseStars(4)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /ahora no/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('muestra el error de envío sin cerrar el modal', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <RatingModal isOpen onClose={vi.fn()} onSubmit={onSubmit} commentEnabled={false} />,
    )

    rerender(
      <RatingModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        commentEnabled={false}
        submitError="No pudimos enviar tu calificación."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No pudimos enviar tu calificación.',
    )
    // El formulario sigue disponible para reintentar.
    expect(
      screen.getByRole('button', { name: /enviar calificación/i }),
    ).toBeInTheDocument()
  })
})

describe('RatingModal — modo con comentario (productos)', () => {
  it('envía `{ rating, comment }` y conserva el comportamiento existente', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<RatingModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />)

    const user = await chooseStars(3)
    await user.type(screen.getByLabelText(/comentario/i), 'Muy buen producto')
    await user.click(screen.getByRole('button', { name: /enviar calificación/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({ rating: 3, comment: 'Muy buen producto' })
  })

  it('no envía sin estrellas seleccionadas', async () => {
    const onSubmit = vi.fn()
    render(<RatingModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />)

    expect(screen.getByRole('button', { name: /enviar calificación/i })).toBeDisabled()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('RatingModal — reapertura rápida', () => {
  it('cancela el reseteo pendiente y conserva la sesión fresca', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { rerender } = render(
      <RatingModal isOpen onClose={vi.fn()} onSubmit={onSubmit} commentEnabled={false} />,
    )

    const user = userEvent.setup()
    const stars = await screen.findAllByRole('radio')
    await user.click(stars[3])
    expect(stars[3]).toHaveAttribute('aria-checked', 'true')

    // Cierra y reabre antes de los 300 ms del reseteo diferido.
    vi.useFakeTimers()
    rerender(
      <RatingModal isOpen={false} onClose={vi.fn()} onSubmit={onSubmit} commentEnabled={false} />,
    )
    vi.advanceTimersByTime(200)
    rerender(
      <RatingModal isOpen onClose={vi.fn()} onSubmit={onSubmit} commentEnabled={false} />,
    )
    // El timer original habría disparado aquí si no se cancelaba.
    vi.advanceTimersByTime(1000)

    expect(screen.getAllByRole('radio')[3]).toHaveAttribute('aria-checked', 'true')
  })
})
