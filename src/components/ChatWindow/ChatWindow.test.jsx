import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatWindow from './ChatWindow.jsx'

const { useAuthMock } = vi.hoisted(() => ({ useAuthMock: vi.fn() }))

vi.mock('../../context/useAuth', () => ({
  useAuth: useAuthMock,
}))

describe('ChatWindow', () => {
  beforeEach(() => {
    useAuthMock.mockReset()
  })

  it('sin token no lanza al montar y renderiza el placeholder', () => {
    // useAuth ya no expone `token`; el componente solo consume `userId`.
    useAuthMock.mockReturnValue({ userId: 'user-1' })

    expect(() =>
      render(<ChatWindow reservationId="res-1" otherName="Comprador" />),
    ).not.toThrow()

    expect(screen.getByText('Chat no disponible')).toBeInTheDocument()
  })
})
