import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatWindow from './ChatWindow.jsx'

const mocks = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  ChatClientMock: vi.fn(),
  fetchMessagesMock: vi.fn(),
  fetchInquiryMessagesMock: vi.fn(),
  createClientMessageIdMock: vi.fn(),
  client: null,
}))

vi.mock('../../context/useAuth', () => ({
  useAuth: mocks.useAuthMock,
}))

vi.mock('../../services/chat.service.js', () => ({
  ChatClient: mocks.ChatClientMock,
  fetchMessages: mocks.fetchMessagesMock,
  createClientMessageId: mocks.createClientMessageIdMock,
}))

vi.mock('../../services/inquiries.service.js', () => ({
  fetchInquiryMessages: mocks.fetchInquiryMessagesMock,
}))

vi.mock('motion/react', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => tag,
    },
  ),
  MotionConfig: ({ children }) => children,
}))

describe('ChatWindow', () => {
  beforeEach(() => {
    mocks.useAuthMock.mockReset()
    mocks.ChatClientMock.mockReset()
    mocks.fetchMessagesMock.mockReset()
    mocks.fetchInquiryMessagesMock.mockReset()
    mocks.createClientMessageIdMock.mockReset()

    mocks.useAuthMock.mockReturnValue({ userId: 'user-1' })
    mocks.fetchMessagesMock.mockResolvedValue([])
    mocks.createClientMessageIdMock.mockReturnValue('client-1')
    mocks.ChatClientMock.mockImplementation(function ChatClientMock({ onStatus, onEvent }) {
      const client = {
        connect: vi.fn(() => onStatus('open')),
        join: vi.fn(),
        send: vi.fn((_, __, clientMessageId) => clientMessageId),
        disconnect: vi.fn(),
        emit: onEvent,
      }
      mocks.client = client
      return client
    })
  })

  it('renders the authenticated chat without requiring a JWT token', async () => {
    mocks.fetchMessagesMock.mockResolvedValue([
      {
        id: 'message-1',
        senderId: 'user-2',
        content: 'Mensaje persistido',
        createdAt: '2026-10-04T12:00:00.000Z',
      },
    ])

    render(<ChatWindow reservationId="res-1" otherName="Comprador" />)

    expect(screen.queryByText('Chat no disponible')).not.toBeInTheDocument()
    expect(await screen.findByText('Mensaje persistido')).toBeInTheDocument()
    expect(screen.getByText('En línea')).toBeInTheDocument()
    expect(mocks.fetchMessagesMock).toHaveBeenCalledWith('res-1')
    expect(mocks.client.join).toHaveBeenCalledWith('res-1')
  })

  it('reconciles an optimistic message and ignores a duplicate server broadcast', async () => {
    const user = userEvent.setup()
    render(<ChatWindow reservationId="res-1" otherName="Comprador" />)

    await user.type(screen.getByRole('textbox', { name: 'Mensaje' }), 'Hola')
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    expect(screen.getAllByText('Hola')).toHaveLength(1)
    expect(mocks.client.send).toHaveBeenCalledWith('res-1', 'Hola', 'client-1')

    act(() => {
      mocks.client.emit({
        type: 'message:new',
        clientMessageId: 'client-1',
        message: {
          id: 'message-1',
          senderId: 'user-1',
          content: 'Hola',
          createdAt: '2026-10-04T12:00:00.000Z',
        },
      })
      mocks.client.emit({
        type: 'message:new',
        message: {
          id: 'message-1',
          senderId: 'user-1',
          content: 'Hola',
          createdAt: '2026-10-04T12:00:00.000Z',
        },
      })
    })

    await waitFor(() => expect(screen.getAllByText('Hola')).toHaveLength(1))
  })

  it('removes a pending message and shows the server error', async () => {
    const user = userEvent.setup()
    render(<ChatWindow reservationId="res-1" otherName="Comprador" />)

    await user.type(screen.getByRole('textbox', { name: 'Mensaje' }), 'No permitido')
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    act(() => {
      mocks.client.emit({
        type: 'error',
        clientMessageId: 'client-1',
        message: 'No se pueden enviar mensajes en una reserva cerrada',
      })
    })

    await waitFor(() => {
      expect(screen.queryByText('No permitido')).not.toBeInTheDocument()
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pueden enviar mensajes en una reserva cerrada',
      )
    })
  })

  it('disables local sending for a read-only conversation', async () => {
    render(<ChatWindow reservationId="res-1" otherName="Comprador" readOnly />)

    expect(screen.getByRole('textbox', { name: 'Mensaje' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enviar mensaje' })).toBeDisabled()
    expect(screen.getByText('Esta conversación está cerrada. Solo lectura.')).toBeInTheDocument()
    expect(mocks.client.send).not.toHaveBeenCalled()
  })

  it('renders inquiry history and uses inquiry events without changing the chat UI', async () => {
    mocks.fetchInquiryMessagesMock.mockResolvedValue([
      {
        id: 'inquiry-message-1',
        senderId: 'user-2',
        content: 'Mensaje de consulta',
        createdAt: '2026-10-04T12:00:00.000Z',
      },
    ])

    render(
      <ChatWindow
        inquiryId="inquiry-1"
        targetType="inquiry"
        otherName="Propietario"
      />,
    )

    expect(await screen.findByText('Mensaje de consulta')).toBeInTheDocument()
    expect(mocks.fetchInquiryMessagesMock).toHaveBeenCalledWith('inquiry-1')
    expect(mocks.ChatClientMock).toHaveBeenCalledWith(expect.objectContaining({ targetType: 'inquiry' }))
    expect(mocks.client.join).toHaveBeenCalledWith('inquiry-1')

    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Mensaje' }), 'Consulta nueva')
    await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    expect(mocks.client.send).toHaveBeenCalledWith('inquiry-1', 'Consulta nueva', 'client-1')

    act(() => {
      mocks.client.emit({
        type: 'inquiry:message:new',
        clientMessageId: 'client-1',
        message: {
          id: 'inquiry-message-2',
          senderId: 'user-1',
          content: 'Consulta nueva',
          createdAt: '2026-10-04T12:01:00.000Z',
        },
      })
    })

    await waitFor(() => expect(screen.getAllByText('Consulta nueva')).toHaveLength(1))
  })
})
