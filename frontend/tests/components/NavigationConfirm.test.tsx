import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationConfirm } from '../../src/components/NavigationConfirm'

describe('NavigationConfirm', () => {
  it('renders dialog with title and description', () => {
    render(<NavigationConfirm onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Leave this page?')).toBeInTheDocument()
    expect(
      screen.getByText('Your current recording will be lost if you leave.'),
    ).toBeInTheDocument()
  })

  it('calls onCancel when Stay is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<NavigationConfirm onConfirm={vi.fn()} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Stay' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when Leave anyway is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<NavigationConfirm onConfirm={onConfirm} onCancel={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Leave anyway' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
