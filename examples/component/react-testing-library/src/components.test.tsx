import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, LoginForm, UserList, type User } from './components'

// ---------------------------------------------------------------------------
// Button — click handler and disabled state
// ---------------------------------------------------------------------------
describe('Button', () => {
  it('renders with the provided label', () => {
    render(<Button label="Save" onClick={() => {}} />)

    // getByRole finds the button by its accessible role and name
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button label="Save" onClick={handleClick} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button label="Save" onClick={handleClick} disabled />)

    // The button should be present but disabled
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toBeDisabled()

    await user.click(button)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('is enabled by default', () => {
    render(<Button label="Submit" onClick={() => {}} />)

    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// LoginForm — submission, validation, user interaction
// ---------------------------------------------------------------------------
describe('LoginForm', () => {
  it('renders email and password fields with a submit button', () => {
    render(<LoginForm onSubmit={() => {}} />)

    // Use getByRole for accessible queries — prefer role over test IDs
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
  })

  it('calls onSubmit with email and password on valid submission', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LoginForm onSubmit={handleSubmit} />)

    // userEvent.type simulates real keystrokes (fires keyDown, keyUp, input)
    await user.type(screen.getByLabelText('Email'), 'alice@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(handleSubmit).toHaveBeenCalledWith('alice@example.com', 'secret123')
  })

  it('shows validation error for invalid email', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LoginForm onSubmit={handleSubmit} />)

    await user.type(screen.getByLabelText('Email'), 'not-an-email')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    // role="alert" is the accessible way to find error messages
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please enter a valid email address',
    )
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error for short password', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LoginForm onSubmit={handleSubmit} />)

    await user.type(screen.getByLabelText('Email'), 'alice@example.com')
    await user.type(screen.getByLabelText('Password'), '12345')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Password must be at least 6 characters',
    )
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('does not show an error before submission', () => {
    render(<LoginForm onSubmit={() => {}} />)

    // queryByRole returns null instead of throwing — use it for absence checks
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears previous error on valid resubmission', async () => {
    const handleSubmit = vi.fn()
    const user = userEvent.setup()

    render(<LoginForm onSubmit={handleSubmit} />)

    // First: trigger a validation error
    await user.type(screen.getByLabelText('Email'), 'bad')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    // Second: fix the email and resubmit
    await user.clear(screen.getByLabelText('Email'))
    await user.type(screen.getByLabelText('Email'), 'alice@example.com')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(handleSubmit).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// UserList — async data loading with loading/error/empty states
// ---------------------------------------------------------------------------
describe('UserList', () => {
  const mockUsers: User[] = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ]

  it('shows a loading indicator while fetching', () => {
    // A promise that never resolves keeps the component in loading state
    const fetchUsers = () => new Promise<User[]>(() => {})

    render(<UserList fetchUsers={fetchUsers} />)

    expect(screen.getByText('Loading users...')).toBeInTheDocument()
  })

  it('renders the user list after loading', async () => {
    const fetchUsers = vi.fn().mockResolvedValue(mockUsers)

    render(<UserList fetchUsers={fetchUsers} />)

    // findByText waits for the element to appear (wraps waitFor internally)
    expect(await screen.findByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('hides the loading indicator after data loads', async () => {
    const fetchUsers = vi.fn().mockResolvedValue(mockUsers)

    render(<UserList fetchUsers={fetchUsers} />)

    await screen.findByText('Alice')

    // queryByText returns null when the element is absent
    expect(screen.queryByText('Loading users...')).not.toBeInTheDocument()
  })

  it('shows an error message when fetch fails', async () => {
    const fetchUsers = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<UserList fetchUsers={fetchUsers} />)

    // waitFor retries until the assertion passes or times out
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Error: Network error',
      )
    })
  })

  it('shows empty state when no users are returned', async () => {
    const fetchUsers = vi.fn().mockResolvedValue([])

    render(<UserList fetchUsers={fetchUsers} />)

    expect(await screen.findByText('No users found')).toBeInTheDocument()
  })

  it('renders the correct number of list items', async () => {
    const fetchUsers = vi.fn().mockResolvedValue(mockUsers)

    render(<UserList fetchUsers={fetchUsers} />)

    await screen.findByText('Alice')

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
  })

  it('calls fetchUsers exactly once on mount', async () => {
    const fetchUsers = vi.fn().mockResolvedValue(mockUsers)

    render(<UserList fetchUsers={fetchUsers} />)

    await screen.findByText('Alice')

    expect(fetchUsers).toHaveBeenCalledTimes(1)
  })
})
