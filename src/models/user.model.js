function calculateInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function extractYear(createdAt) {
  return createdAt ? new Date(createdAt).getFullYear() : 2024
}

export function createOwner(apiData) {
  return {
    name: apiData.name,
    initials: calculateInitials(apiData.name),
    verified: apiData.isIdentityVerified || false,
    memberSince: extractYear(apiData.createdAt),
  }
}
