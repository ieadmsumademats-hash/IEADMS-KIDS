import React from 'react';
import { Baby, Star, Heart, Music } from 'lucide-react';

const PaisBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-purple-main" />
      
      {/* Subtle Kids Icons */}
      <div className="absolute top-10 left-10 text-white/5 rotate-12"><Baby className="w-32 h-32" /></div>
      <div className="absolute bottom-20 right-10 text-white/5 -rotate-12"><Star className="w-24 h-24" /></div>
      <div className="absolute top-1/3 right-5 text-white/5 rotate-45"><Heart className="w-20 h-20" /></div>
      <div className="absolute bottom-1/3 left-5 text-white/5 -rotate-12"><Music className="w-28 h-28" /></div>
      
      {/* Soft Glows */}
      <div className="absolute top-[-100px] right-[-100px] w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-50px] left-[-50px] w-60 h-60 bg-yellow-main/10 rounded-full blur-3xl" />
    </div>
  );
};

export default PaisBackground;
