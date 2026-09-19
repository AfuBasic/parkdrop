import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Button } from './Button'

test('Button renders with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeDefined()
})
