import { Redirect } from "expo-router"

const welcome = () => {
  return (
    <Redirect href="/(onboarding)/profile-setup" />
  )
}

export default welcome