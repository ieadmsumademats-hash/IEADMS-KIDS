import React from 'react';
import { Baby, Star, Heart, Music } from 'lucide-react';

const PaisBackground: React.FC = () => {
  return (
    <>
      {/* Background Elements */}
      <div className="fixed inset-0 bg-purple-main -z-20" />
      
      {/* Subtle Kids Icons */}
      <div className="fixed top-10 left-10 text-white/5 rotate-12 -z-10"><Baby className="w-32 h-32" /></div>
      <div className="fixed bottom-20 right-10 text-white/5 -rotate-12 -z-10"><Star className="w-24 h-24" /></div>
      <div className="fixed top-1/3 right-5 text-white/5 rotate-45 -z-10"><Heart className="w-20 h-20" /></div>
      <div className="fixed bottom-1/3 left-5 text-white/5 -rotate-12 -z-10"><Music className="w-28 h-28" /></div>
      
      {/* Soft Glows */}
      <div className="fixed top-[-100px] right-[-100px] w-80 h-80 bg-white/5 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-[-50px] left-[-50px] w-60 h-60 bg-yellow-main/10 rounded-full blur-3xl -z-10" />
    </>
  );
};

export default PaisBackground;
