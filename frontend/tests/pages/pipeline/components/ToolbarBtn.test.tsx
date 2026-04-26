import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToolbarBtn } from '../../../../src/pages/pipeline/components/ToolbarBtn'

describe('ToolbarBtn', () => {
  it('renders visible label and matching aria-label', () => {
    const onClick = vi.fn()
    render(
      <ToolbarBtn onClick={onClick} icon={<span data-testid="icon">I</span>} label="Save" />,
    )
    const btn = screen.getByRole('button', { name: 'Save' })
    expect(btn).toHaveTextContent('Save')
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('invokes onClick when enabled', () => {
    const onClick = vi.fn()
    render(
      <ToolbarBtn onClick={onClick} icon={<span />} label="Go" />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not invoke onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <ToolbarBtn onClick={onClick} icon={<span />} label="Go" disabled />,
    )
    const btn = screen.getByRole('button', { name: 'Go' })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('applies primary styles when primary is true', () => {
    const onClick = vi.fn()
    const { container } = render(
      <ToolbarBtn onClick={onClick} icon={<span />} label="Primary" primary />,
    )
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('bg-primary')
  })

  it('applies secondary styles when primary is false', () => {
    const onClick = vi.fn()
    const { container } = render(
      <ToolbarBtn onClick={onClick} icon={<span />} label="Secondary" />,
    )
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('bg-secondary')
  })
})
