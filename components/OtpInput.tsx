import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

interface OtpInputProps {
    length?: number;
    onComplete: (otp: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, onComplete }) => {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize GSAP context
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Initial animation for boxes - simple fade in, NO Y-offset to prevent layout shift
            gsap.from(".otp-box", {
                scale: 0.5,
                opacity: 0,
                stagger: 0.05,
                duration: 0.5,
                ease: "back.out(1.5)"
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const animateInput = (index: number, type: 'enter' | 'leave') => {
        const element = inputRefs.current[index];
        if (!element) return;

        if (type === 'enter') {
            gsap.fromTo(element,
                { scale: 1.5, opacity: 0, color: '#00F0FF' },
                { scale: 1, opacity: 1, color: '#FFFFFF', duration: 0.4, ease: "back.out(2)" }
            );
            // Glow effect on container
            gsap.fromTo(element.parentElement,
                { boxShadow: "0 0 0px #00F0FF", borderColor: "#00F0FF" },
                { boxShadow: "0 0 15px #00F0FF", borderColor: "#00F0FF", duration: 0.2, yoyo: true, repeat: 1 }
            );
        } else {
            gsap.to(element, { opacity: 0, scale: 0.5, duration: 0.2 });
            gsap.to(element.parentElement, { borderColor: "rgba(255,255,255,0.1)", boxShadow: "none", duration: 0.2 });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        // Allow only last entered character
        const char = value.substring(value.length - 1);
        newOtp[index] = char;
        setOtp(newOtp);

        const combinedOtp = newOtp.join("");
        onComplete(combinedOtp);

        if (char) {
            animateInput(index, 'enter');
            // Move to next input
            if (index < length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace") {
            if (!otp[index] && index > 0) {
                // Determine if we need to clear previous input and focus
                const newOtp = [...otp];
                newOtp[index - 1] = "";
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
                animateInput(index - 1, 'leave');
                onComplete(newOtp.join(""));
            } else if (otp[index]) {
                const newOtp = [...otp];
                newOtp[index] = "";
                setOtp(newOtp);
                animateInput(index, 'leave');
                onComplete(newOtp.join(""));
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const data = e.clipboardData.getData("text");
        const numbers = data.replace(/[^0-9]/g, "").slice(0, length).split("");

        if (numbers.length > 0) {
            const newOtp = [...otp];
            numbers.forEach((num, i) => {
                newOtp[i] = num;
                // Animate staggered
                setTimeout(() => animateInput(i, 'enter'), i * 50);
            });
            setOtp(newOtp);
            onComplete(newOtp.join(""));

            // Focus last filled or next empty
            const nextIndex = Math.min(numbers.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    return (
        <div ref={containerRef} className="flex flex-nowrap gap-2 justify-center my-6 w-full">
            {otp.map((data, index) => (
                <div key={index} className="otp-box relative shrink-0 w-10 h-12 md:w-12 md:h-14 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                    <input
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        value={data}
                        onChange={(e) => handleChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={handlePaste}
                        className="w-full h-full bg-transparent text-center text-xl md:text-2xl font-mono text-white outline-none caret-[#00F0FF]"
                    />
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-white/30 hidden"></div>
                    <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-white/30 hidden"></div>
                </div>
            ))}
        </div>
    );
};

export default OtpInput;
