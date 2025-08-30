
import { cn } from "@/lib/utils";
import React from "react";

export const GeminiLogo = ({ className }: { className?: string }) => (
    <svg 
        className={cn("text-[#5184E5]", className)}
        width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.5,12.5a2,2,0,1,0,2,2,2,2,0,0,0-2-2" fill="currentColor"></path>
        <path d="M17.5,12.5a2,2,0,1,0,2,2,2,2,0,0,0-2-2" fill="currentColor"></path>
        <path d="M12.83,4.08,11.17,7.42a1,1,0,0,1-1.74,0L7.76,4.08a1,1,0,0,0-1.74,1l5,8.66a1,1,0,0,0,1.74,0l5-8.66a1,1,0,0,0-1.74-1Z" fill="currentColor"></path>
    </svg>
);


export const OpenAIColorLogo = ({ className }: { className?: string }) => (
    <svg
      className={cn("text-[#74AA9C]", className)}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.998 13.674c.475 0 .95.067 1.425.201.334.067.402.469.134.67l-3.218 2.482c-.334.268-.871.067-1.005-.335l-1.072-3.418c2.011.402 3.016.402 3.737.402zM7.002 13.674c-.47 0-.943.067-1.418.201-.335.067-.403.469-.134.67l3.218 2.482c.334.268.871.067 1.005-.335l1.072-3.418c-2.011.402-3.016.402-3.743.402zM12 2.997c-4.961 0-8.991 4.03-8.991 8.991s4.03 8.991 8.991 8.991 8.991-4.03 8.991-8.991-4.03-8.991-8.991-8.991zm5.594 12.355c-1.425-.603-2.35-.939-2.35-1.543 0-.67.737-1.14 1.81-1.14 1.005 0 1.676.402 2.417.804.268.134.603.067.737-.201l.804-1.608c.134-.268.067-.603-.201-.737-1.005-.536-2.484-.939-4.156-.939-2.484 0-4.625 1.608-4.625 4.022 0 2.215 1.425 3.352 3.418 4.223 1.492.67 2.417 1.072 2.417 1.676 0 .67-.804 1.207-2.011 1.207-1.274 0-2.146-.47-2.885-.871-.268-.134-.603-.067-.804.134l-.871 1.676c-.134.268-.067.603.201.804 1.207.603 2.685 1.005 4.424 1.005 2.818 0 4.893-1.608 4.893-4.089 0-2.079-1.274-3.285-3.418-4.156z"
        fill="currentColor"
      />
    </svg>
);


export const DeepseekLogo = ({ className }: { className?: string }) => (
    <svg
      className={cn("text-primary", className)}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M12 7v10M7 9.5l5-2.5 5 2.5M7 14.5l5-2.5 5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
);

export const OllamaLogo = ({ className }: { className?: string }) => (
    <svg
      className={cn("text-[#FF6B35]", className)}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

export const AnthropicLogo = ({ className }: { className?: string }) => (
    <svg
      className={cn("text-[#D97706]", className)}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M12 7v10M7 9.5l5-2.5 5 2.5M7 14.5l5-2.5 5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
);
