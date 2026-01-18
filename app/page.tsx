import { GameProvider } from "@/context/game-context"
import { GameLayout } from "@/components/game-layout"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <GameProvider>
      <main className="h-screen w-full flex items-center justify-center overflow-hidden">
        <GameLayout />
      </main>
    </GameProvider>
  )
}
