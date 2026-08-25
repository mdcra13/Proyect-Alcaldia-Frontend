import { describe, expect, it } from 'vitest'
import { decodeText, normalizeDepartamentoNombre } from '@/lib/utils'

describe('decodeText', () => {
  it.each([
    ['Secretar\\00EDa General', 'Secretaría General'],
    ['Tesorer\\00EDa Municipal', 'Tesorería Municipal'],
    ['Direcci\\00F3n de Tecnolog\\00EDa de la Informaci\\00F3n', 'Dirección de Tecnología de la Información'],
    ['EducaciÃ³n', 'Educación'],
    ['Informaci%C3%B3n', 'Información'],
  ])('repara %s', (input, expected) => expect(decodeText(input)).toBe(expected))

  it('no altera texto Unicode válido', () => {
    expect(decodeText('Secretaría General')).toBe('Secretaría General')
  })

  it('recupera variantes conocidas que ya perdieron sus bytes', () => {
    expect(normalizeDepartamentoNombre('Secretar??a General')).toBe('Secretaría General')
  })
})
