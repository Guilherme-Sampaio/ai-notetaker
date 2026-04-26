import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavItem } from '../../src/components/NavItem'

describe('NavItem', () => {
  it('calls onClick when pressed', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <NavItem icon={<span data-testid="ic">i</span>} label="Record" active={false} onClick={onClick} />,
    )
    await user.click(screen.getByRole('button', { name: 'Record' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('sets aria-current=page when active', () => {
    render(
      <NavItem icon={<span>i</span>} label="Notes" active onClick={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Notes' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not set aria-current when inactive', () => {
    render(
      <NavItem icon={<span>i</span>} label="Notes" active={false} onClick={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Notes' })).not.toHaveAttribute('aria-current')
  })
})
