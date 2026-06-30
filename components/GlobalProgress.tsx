import React, { useEffect, useState } from 'react';

type ProgressState = {
  isProcessing: boolean;
  message?: string;
};

class ProgressService {
  private listeners: ((state: ProgressState) => void)[] = [];
  private processingCount = 0;
  private currentMessage = 'Processando...';

  subscribe(listener: (state: ProgressState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener({ isProcessing: this.processingCount > 0, message: this.currentMessage }));
  }

  start(message = 'Processando...') {
    this.currentMessage = message;
    this.processingCount++;
    this.notify();
  }

  stop() {
    this.processingCount = Math.max(0, this.processingCount - 1);
    this.notify();
  }
}

export const globalProgress = new ProgressService();

export const GlobalProgressBar: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState('Processando...');

  useEffect(() => {
    return globalProgress.subscribe((state) => {
      setIsProcessing(state.isProcessing);
      if (state.isProcessing) {
        // We could theoretically pass text, but the current ProgressService doesn't support it.
        // Let's just use a general fun message, or cycle them if we can't customize per call.
        // Wait, the prompt says: "Exiba uma mensagem curta conforme a operação, por exemplo: 'Salvando...'"
        // To do this, we need to modify ProgressService to accept a message.
        setLoadingText(state.message || 'Processando...');
      }
    });
  }, []);

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-white/90 backdrop-blur-sm" aria-busy="true">
      <div className="flex flex-col items-center p-8 bg-white rounded-[3rem] shadow-2xl border-4 border-purple-main/10 max-w-xs w-full text-center mx-4">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center motion-safe:animate-bounce">
           <img 
             src="https://raw.githubusercontent.com/ieadmsumademats-hash/imagens/main/logokids.PNG" 
             alt="IEADMS Kids Logo" 
             className="w-full h-full object-contain"
           />
           {/* Shadow effect */}
           <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-2 bg-black/10 rounded-full animate-pulse" />
        </div>
        <div className="text-purple-dark font-black text-xl uppercase tracking-widest animate-pulse">
          {loadingText}
        </div>
      </div>
    </div>
  );
};
