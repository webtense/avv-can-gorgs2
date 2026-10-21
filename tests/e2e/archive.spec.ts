import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Archive API', () => {
  test('GET /api/archive devuelve lista con items', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/archive?limit=5`)
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBeTruthy()
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('page')
    expect(data).toHaveProperty('limit')
    expect(data).toHaveProperty('hasMore')
  })

  test('GET /api/archive con search filtra', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/archive?search=test&limit=10`)
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('items')
  })

  test('GET /api/archive con type inválido devuelve 400', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/archive?type=invalid`)
    expect(response.status()).toBe(400)
  })

  test('GET /api/archive/{id} devuelve detalle o 404', async ({ request }) => {
    const listResponse = await request.get(`${BASE_URL}/api/archive?limit=1`)
    const listData = await listResponse.json()
    if (listData?.items?.length > 0) {
      const id = listData.items[0].id
      const detailResponse = await request.get(`${BASE_URL}/api/archive/${id}`)
      expect([200, 404]).toContain(detailResponse.status())
      if (detailResponse.status() === 200) {
        const detail = await detailResponse.json()
        expect(detail).toHaveProperty('content')
        expect(detail).toHaveProperty('relatedItems')
      }
    }
  })

  test('GET /api/archive/{id-invalido} devuelve 400', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/archive/no-es-un-uuid`)
    expect(response.status()).toBe(400)
  })
})

test.describe('Search API', () => {
  test('GET /api/search?q= devuelve resultados', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/search?q=evento&limit=5`)
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('items')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('query', 'evento')
  })

  test('GET /api/search sin q devuelve 400', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/search`)
    expect(response.status()).toBe(400)
  })
})

test.describe('Version & Health', () => {
  test('GET /api/version devuelve buildId', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/version`)
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('version')
    expect(data).toHaveProperty('buildId')
    expect(data).toHaveProperty('buildTime')
  })

  test('GET /api/health devuelve status ok', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`)
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data).toHaveProperty('timestamp')
  })

  test('GET /api/changelog devuelve versiones', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/changelog`)
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('changelog')
    expect(Array.isArray(data.changelog)).toBeTruthy()
    expect(data.changelog.length).toBeGreaterThan(0)
  })
})

test.describe('Error handling', () => {
  test('GET /api/archive/{bad-id} devuelve 400 (UUID inválido)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/archive/nonexistent-id`)
    expect(response.status()).toBe(400)
  })

  test('GET /api/archive con limit > 100 se limita', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/archive?limit=999`)
    expect([200, 400]).toContain(response.status())
    if (response.status() === 200) {
      const data = await response.json()
      expect(data.limit).toBeLessThanOrEqual(100)
    }
  })
})
