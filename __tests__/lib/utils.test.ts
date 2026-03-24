import { cn, formatPrice, formatDate } from '@/lib/utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('px-4', 'py-2', 'bg-blue-500')
    expect(result).toBe('px-4 py-2 bg-blue-500')
  })

  it('handles conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toContain('active-class')
  })

  it('removes falsy values', () => {
    const result = cn('base', false, null, undefined, 'end')
    expect(result).toBe('base end')
  })

  it('merges tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-8')
    expect(result).toBe('py-2 px-8')
  })
})

describe('formatPrice utility function', () => {
  it('formats price in EUR correctly', () => {
    const result = formatPrice(1234.56)
    expect(result).toMatch(/1[\s\u00A0]?234,56/)
    expect(result).toContain('€')
  })

  it('handles zero correctly', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('handles negative numbers', () => {
    const result = formatPrice(-100)
    expect(result).toContain('-')
    expect(result).toContain('100')
  })
})

describe('formatDate utility function', () => {
  it('formats date correctly in French locale', () => {
    const date = new Date('2024-03-15')
    const result = formatDate(date)
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('handles string dates', () => {
    const result = formatDate('2024-03-15')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })
})
