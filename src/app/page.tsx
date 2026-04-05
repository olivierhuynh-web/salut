import Dialpad from './ui/dialpad'

export default function Home() {
  return (
    <main className="h-screen bg-white flex items-center justify-center overflow-hidden">
      <div className="
        w-full h-full
        md:w-80 md:h-170 md:relative
        md:rounded-[45px] md:border-2 md:border-black
      ">
        {/* Dynamic island */}
        <div className="hidden md:block absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 border-2 border-black rounded-full z-10" />

        <Dialpad />
      </div>
    </main>
  )
}
