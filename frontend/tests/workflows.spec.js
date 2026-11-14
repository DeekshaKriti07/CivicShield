import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const password = 'test-only-password-for-browser'

async function login(page, username = 'test-operator') {
  await page.goto('/')
  await page.getByLabel('Username', { exact: true }).fill(username)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await accessible(page)
  await noOverflow(page)
  await page.getByRole('button', { name: 'Open Console', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Command Center' }),
  ).toBeVisible()
}
async function create(
  page,
  description = 'Broken drain cover outside the library',
) {
  await page.getByLabel('Description', { exact: true }).fill(description)
  await page.getByLabel('Latitude', { exact: true }).fill('0')
  await page.getByLabel('Longitude', { exact: true }).fill('0')
  await page.getByRole('button', { name: 'Save report', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Incident record', exact: true }),
  ).toBeVisible()
}
async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
}
async function accessible(page) {
  const results = await new AxeBuilder({ page }).analyze()
  expect(
    results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact),
    ),
  ).toEqual([])
}

test('reporter account, actual report, reload, analysis and logout', async ({
  page,
}) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await accessible(page)
  await page.getByRole('button', { name: 'Create a reporter account' }).click()
  const username = `reporter-${Date.now()}`
  await page.getByLabel('Username', { exact: true }).fill(username)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('Account created')
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await accessible(page)
  await noOverflow(page)
  await page.getByRole('button', { name: 'Open Console', exact: true }).click()
  await expect(page.getByText('No reports yet', { exact: true })).toBeVisible()
  await accessible(page)
  await create(page, 'Flooded street near the library')
  const url = page.url()
  await page.reload()
  await expect(
    page.getByText('Flooded street near the library', { exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Run analysis' }).click()
  await expect(
    page.getByText('Awaiting operator review.', { exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Keyword rules', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Approve reviewed plan' }),
  ).toHaveCount(0)
  await accessible(page)
  await noOverflow(page)
  await page.screenshot({
    path: `test-results/reporter-${test.info().project.name}.png`,
    fullPage: true,
  })
  await page.getByRole('link', { name: 'View record history' }).click()
  await expect(
    page.getByRole('heading', { name: 'ANALYZED', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome back.', exact: true }),
  ).toBeVisible()
  await page.goto(url)
  await expect(
    page.getByRole('heading', { name: 'Welcome back.', exact: true }),
  ).toBeVisible()
  expect(errors).toEqual([])
})

test('operator reviews, assigns internally and records a resolution', async ({
  page,
}) => {
  await login(page)
  await create(page, 'Fire and smoke reported near a closed warehouse')
  await page.getByRole('button', { name: 'Run analysis' }).click()
  await expect(page.getByText('35/100 · MEDIUM', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Approve reviewed plan' }).click()
  await expect(page.getByText('APPROVED', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Record internal assignment' }).click()
  await page
    .getByLabel('Resolution note')
    .fill(
      'Operator checked the location and recorded that the access is clear.',
    )
  await page
    .getByRole('button', { name: 'Record resolution', exact: true })
    .click()
  await expect(page.getByText('RESOLVED', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('RESOLVED', { exact: true })).toBeVisible()
  await accessible(page)
  await page.getByRole('link', { name: 'View record history' }).click()
  await expect(
    page.getByText(
      'Operator checked the location and recorded that the access is clear.',
      { exact: true },
    ),
  ).toBeVisible()
  await expect(
    page.getByText(
      'Internal assignment recorded. No external service was contacted.',
      { exact: true },
    ),
  ).toBeVisible()
  await noOverflow(page)
})

test('incorrect password and expired sessions have recoverable states', async ({
  page,
  context,
}) => {
  await page.goto('/')
  await page.getByLabel('Username', { exact: true }).fill('test-operator')
  await page.getByLabel('Password', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Invalid username or password.',
  )
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await accessible(page)
  await noOverflow(page)
  await page.getByRole('button', { name: 'Open Console', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Command Center' }),
  ).toBeVisible()
  await context.clearCookies()
  await page.getByRole('button', { name: 'Refresh records' }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome back.', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('session expired')
})

test('server outage, validation, theme and profile', async ({ page }) => {
  await login(page)
  await page
    .getByLabel('Description', { exact: true })
    .fill('Invalid coordinates test')
  await page.getByLabel('Latitude', { exact: true }).fill('100')
  await page.getByLabel('Longitude', { exact: true }).fill('0')
  await page.getByRole('button', { name: 'Save report', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Command Center' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Use light theme' }).click()
  await page.getByRole('button', { name: 'Use dark theme' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await accessible(page)
  await noOverflow(page)
  await page.getByRole('link', { name: 'test-operator', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your account' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Your account' }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Use light theme' }).click()
  await page.getByRole('link', { name: 'Reports', exact: true }).click()
  await page.route('**/api/incidents?**', (route) => route.abort())
  await page.getByRole('button', { name: 'Refresh records' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Unable to reach CivicShield',
  )
  await page.unroute('**/api/incidents?**')
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('unavailable records never substitute a demo and user text is escaped', async ({
  page,
}) => {
  await login(page)
  await page.goto('/#incident/99999999')
  await expect(page.getByRole('alert')).toContainText('Incident not found')
  await expect(page.getByText('INC-001')).toHaveCount(0)
  await page.getByRole('link', { name: 'Reports', exact: true }).first().click()
  const description =
    '<img src=x onerror="window.__injected=true"> Broken street sign'
  await create(page, description)
  await expect(page.getByText(description, { exact: true })).toBeVisible()
  expect(await page.evaluate(() => window.__injected)).toBeUndefined()
  await noOverflow(page)
})
