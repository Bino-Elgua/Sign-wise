
import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
  onSign: (dataUrl: string) => void;
  onClear: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSign, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Scale for high DPI if necessary, but keep it simple for now
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasStarted(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (isDrawing && canvasRef.current) {
      onSign(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStarted(false);
    onClear();
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full h-64 bg-slate-50 border-[3px] border-slate-100 rounded-[2.5rem] overflow-hidden cursor-crosshair group shadow-inner">
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className="w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
        {!hasStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-200 select-none space-y-4">
            <i className="fa-solid fa-pen-nib text-5xl opacity-40"></i>
            <span className="text-xl font-serif italic tracking-widest">Acknowledge Terms & Sign Here</span>
          </div>
        )}
        <div className="absolute bottom-4 left-6 flex items-center gap-2 opacity-30 select-none">
           <i className="fa-solid fa-lock text-[10px]"></i>
           <span className="text-[8px] font-black uppercase tracking-[0.4em]">Encrypted Signature Trace Active</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); clear(); }}
          className="absolute top-4 right-6 bg-white border border-slate-200 text-slate-400 p-3 rounded-2xl text-[9px] font-black uppercase hover:text-red-500 hover:border-red-500 transition shadow-sm"
        >
          Clear Trace
        </button>
      </div>
      <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest italic leading-relaxed">
        By signing above, you confirm that you have reviewed the AI-generated audit trail and understand the identified risks.
      </p>
    </div>
  );
};

export default SignaturePad;
