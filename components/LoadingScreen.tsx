import React, { useEffect, useState } from 'react';
import { Baby, Star, Heart, Music } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Simulate loading time or wait for actual data
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        onComplete();
      }, 500); // Wait for fade out animation
    }, 2000); // 2 seconds minimum loading time

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-purple-main transition-opacity duration-500 overflow-hidden ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Background Elements */}
      <div className="absolute top-10 left-10 text-white/10 rotate-12 animate-pulse"><Baby className="w-32 h-32" /></div>
      <div className="absolute bottom-20 right-10 text-white/10 -rotate-12 animate-bounce"><Star className="w-24 h-24" /></div>
      <div className="absolute top-1/3 right-5 text-white/10 rotate-45 animate-pulse"><Heart className="w-20 h-20" /></div>
      <div className="absolute bottom-1/3 left-5 text-white/10 -rotate-12 animate-bounce"><Music className="w-28 h-28" /></div>
      
      <div className="fixed top-[-100px] right-[-100px] w-80 h-80 bg-white/5 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-[-50px] left-[-50px] w-60 h-60 bg-yellow-main/10 rounded-full blur-3xl -z-10" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-700">
        <div className="bg-white p-6 rounded-full shadow-2xl mb-8 animate-bounce">
          <img 
            src="https://raw.githubusercontent.com/ieadmsumademats-hash/imagens/main/logokids.PNG" 
            alt="Logo IEADMS Kids" 
            className="w-24 h-24 object-contain" 
          />
        </div>
        
        <h1 className="kids-font text-4xl font-black text-white mb-4 tracking-wider text-center">
          IEADMS <span className="text-yellow-main">KIDS</span>
        </h1>
        
        <div className="flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
          <div className="w-5 h-5 border-4 border-yellow-main border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white font-bold text-sm tracking-widest uppercase">Carregando diversão...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
