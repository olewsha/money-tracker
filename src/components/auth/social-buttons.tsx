import { Button } from '@/components/ui/button'
import { GithubIcon } from '@/components/icons/github'
import { GoogleIcon } from '@/components/icons/google'
import { signInWithProvider } from '@/app/actions/auth'

async function googleAction() {
  'use server'
  await signInWithProvider('google')
}

async function githubAction() {
  'use server'
  await signInWithProvider('github')
}

export function SocialButtons() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <form action={googleAction}>
        <Button type="submit" variant="outline" className="w-full">
          <GoogleIcon className="size-4" />
          Google
        </Button>
      </form>
      <form action={githubAction}>
        <Button type="submit" variant="outline" className="w-full">
          <GithubIcon className="size-4" />
          GitHub
        </Button>
      </form>
    </div>
  )
}
