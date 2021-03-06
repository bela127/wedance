import useAuth from '~/use/auth'

export default async ({ route, redirect }) => {
  const { getAccount, isAccountConfirmed } = useAuth()

  await getAccount()

  const routes = ['/onboarding', '/signout']

  if (!isAccountConfirmed() && !routes.includes(route.path)) {
    redirect('/onboarding')
  }
}
