import apiClient from './api'
import { createProduct } from '../models/product.model.js'

export function getProducts() {
  return apiClient('/products').then((data) => data.map(createProduct))
}

export function getProductById(id) {
  return apiClient(`/products/${id}`).then(createProduct)
}
