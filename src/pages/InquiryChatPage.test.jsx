import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InquiryChatPage from './InquiryChatPage.jsx'

const mocks = vi.hoisted(() => ({
  fetchInquiry: vi.fn(),
  useAuth: vi.fn(),
  ChatWindow: vi.fn(),
}))

vi.mock('../services/inquiries.service.js', () => ({
  fetchInquiry: mocks.fetchInquiry,
}))

vi.mock('../context/useAuth', () => ({
  useAuth: mocks.useAuth,
}))

vi.mock('../components/ChatWindow/ChatWindow.jsx', () => ({
  default: mocks.ChatWindow,
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

beforeEach(() => {
  mocks.fetchInquiry.mockReset().mockResolvedValue({
    id: 'inquiry-1',
    createdAt: '2026-10-04T10:00:00.000Z',
    requester: { id: 'requester-1', name: 'Ana Inquilina' },
    product: {
      id: 'product-1',
      title: 'Sierra circular',
      ownerId: 'owner-1',
      owner: { id: 'owner-1', name: 'Dueño Uno' },
    },
  })
  mocks.useAuth.mockReturnValue({ userId: 'owner-1' })
  mocks.ChatWindow.mockImplementation((props) => (
    <div data-testid="reused-chat">{props.otherName}</div>
  ))
})

describe('InquiryChatPage', () => {
  it('renders inquiry context and reuses ChatWindow with the inquiry target', async () => {
    render(
      <MemoryRouter initialEntries={['/chat/inquiry/inquiry-1']}>
        <Routes>
          <Route path="/chat/inquiry/:inquiryId" element={<InquiryChatPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Sierra circular' })).toBeInTheDocument()
    expect(screen.getByText('Consulta pre-alquiler')).toBeInTheDocument()
    expect(screen.getByText('Ana Inquilina')).toBeInTheDocument()
    expect(screen.getByTestId('reused-chat')).toHaveTextContent('Ana Inquilina')
    expect(mocks.ChatWindow).toHaveBeenCalled()
    expect(mocks.ChatWindow.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        inquiryId: 'inquiry-1',
        targetType: 'inquiry',
        otherName: 'Ana Inquilina',
      }),
    )
  })
})
