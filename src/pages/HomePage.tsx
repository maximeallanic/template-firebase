import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-indigo-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl w-full z-10 flex flex-col items-center">

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16 space-y-4"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic drop-shadow-2xl">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">SPICY</span>
            <span className="text-white mx-4 font-thin opacity-50 text-4xl align-middle">VS</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">SWEET</span>
          </h1>
          <p className="text-xl md:text-2xl text-indigo-200 font-medium tracking-wide">
            The Ultimate Interactive Quiz Show
          </p>
        </motion.div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">

          {/* Host Card */}
          <Link to="/host" className="block group">
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-80 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 p-8 flex flex-col items-center justify-center text-center overflow-hidden transition-colors hover:bg-white/10 hover:border-red-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/0 to-orange-500/0 group-hover:from-red-500/20 group-hover:to-orange-500/20 transition-all duration-500"></div>

              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">👨‍🍳</div>
              <h2 className="text-3xl font-black text-white italic mb-2">HOST A GAME</h2>
              <p className="text-gray-300 group-hover:text-white transition-colors">
                Open your kitchen, invite friends, <br />and became the Grand Miam Master!
              </p>

              <div className="mt-8 px-6 py-2 rounded-full bg-red-500 text-white font-bold text-sm tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                Create Room
              </div>
            </motion.div>
          </Link>

          {/* Join Card */}
          <Link to="/join" className="block group">
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-80 rounded-3xl bg-white/5 backdrop-blur-lg border border-white/10 p-8 flex flex-col items-center justify-center text-center overflow-hidden transition-colors hover:bg-white/10 hover:border-pink-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-pink-500/20 group-hover:to-purple-500/20 transition-all duration-500"></div>

              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🎮</div>
              <h2 className="text-3xl font-black text-white italic mb-2">JOIN A GAME</h2>
              <p className="text-gray-300 group-hover:text-white transition-colors">
                Enter a room code, chose your team, <br />and fight for glory!
              </p>

              <div className="mt-8 px-6 py-2 rounded-full bg-pink-500 text-white font-bold text-sm tracking-widest uppercase opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all">
                Enter Code
              </div>
            </motion.div>
          </Link>

        </div>

        {/* Footer */}
        <footer className="mt-20 text-white/20 text-sm font-mono tracking-widest uppercase">
          Spicy VS Sweety • {new Date().getFullYear()} • 25g de Sel
        </footer>

      </div>
    </div>
  );
}
