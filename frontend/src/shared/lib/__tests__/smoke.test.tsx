import { useTranslation } from 'react-i18next'
import { renderWithProviders, screen } from '../../../../tests/test-utils'

function SmokeI18n() {
  const { t } = useTranslation()
  return <span data-testid="i18n-smoke">{t('smoke.hello')}</span>
}

describe('smoke', () => {
  it('renders without crashing', () => {
    renderWithProviders(<div data-testid="smoke">ok</div>)
    expect(screen.getByTestId('smoke')).toBeInTheDocument()
    expect(screen.getByTestId('smoke')).toHaveTextContent('ok')
  })

  it('i18n returns keys or translations', () => {
    renderWithProviders(<SmokeI18n />)
    expect(screen.getByTestId('i18n-smoke')).toHaveTextContent('Hello')
  })
})
