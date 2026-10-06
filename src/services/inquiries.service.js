import apiClient from './api'

function normalizeList(data) {
  return Array.isArray(data) ? data : []
}

function normalizeMessages(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.messages)) return data.messages
  return []
}

// Creates or reuses the authenticated user's inquiry for a product.
export function createInquiry(productId) {
  return apiClient('/inquiries', {
    method: 'POST',
    body: { productId },
  })
}

// Lists inquiries visible to the authenticated user as requester or owner.
export async function fetchInquiries() {
  const data = await apiClient('/inquiries')
  return normalizeList(data)
}

export function fetchInquiry(inquiryId) {
  return apiClient(`/inquiries/${inquiryId}`)
}

// History is best-effort, matching the existing reservation chat client.
export async function fetchInquiryMessages(inquiryId) {
  try {
    const data = await apiClient(`/inquiries/${inquiryId}/messages`)
    return normalizeMessages(data)
  } catch {
    return []
  }
}
