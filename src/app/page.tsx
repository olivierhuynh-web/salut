import Dialpad from './ui/dialpad'

export default function Home() {
  return (
    <main className="h-screen bg-white flex flex-col overflow-x-hidden overflow-y-hidden">
      <div className="w-full h-full max-w-sm mx-auto">
        <Dialpad />
      </div>
    </main>
  )
}
