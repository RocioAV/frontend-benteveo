import apiClient from './api'
import { createOwner } from '../models/user.model.js'

export function getUserById(id) {
  return apiClient(`/user/${id}`).then(createOwner)
}
