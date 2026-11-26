import React from 'react';
import { NaturalistPersona } from '../types';

interface PersonaBadgeIconProps {
  persona: NaturalistPersona;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PersonaBadgeIcon: React.FC<PersonaBadgeIconProps> = ({
  persona,
  size = 'md',
  className = '',
}) => {
  const sizeClass =
    size === 'sm'
      ? 'w-7 h-7 rounded-lg'
      : size === 'lg'
      ? 'w-20 h-20 rounded-[22px]'
      : 'w-11 h-11 rounded-xl';

  const svgClass =
    size === 'sm'
      ? 'w-4 h-4'
      : size === 'lg'
      ? 'w-12 h-12'
      : 'w-6 h-6';

  const renderSvg = () => {
    switch (persona) {
      case 'botanist':
        return (
          <svg viewBox="0 0 48 48" className={svgClass} fill="none">
            <path d="M12 36C18 28 28 18 36 12" stroke="#3B8224" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M22 26C14 26 11 19 15 14C20 14 24 19 22 26Z" fill="#5FA800" />
            <path d="M27 21C35 21 38 14 34 9C29 9 25 14 27 21Z" fill="#77C217" />
            <path d="M28 27C35 29 37 35 32 38C27 37 25 32 28 27Z" fill="#5FA800" />
          </svg>
        );
      case 'entomologist':
        return (
          <svg viewBox="0 0 48 48" className={svgClass} fill="none">
            <ellipse cx="21" cy="18" rx="8" ry="5" transform="rotate(-25 21 18)" fill="#E2EDF8" stroke="#9DB5D0" strokeWidth="1.5" />
            <ellipse cx="29" cy="19" rx="7" ry="4.5" transform="rotate(20 29 19)" fill="#E2EDF8" stroke="#9DB5D0" strokeWidth="1.5" />
            <ellipse cx="24" cy="28" rx="9" ry="7" transform="rotate(-18 24 28)" fill="#F2B705" />
            <path d="M18 26C21 24 26 26 28 31" stroke="#202320" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M22 23C25 22 29 24 31 28" stroke="#202320" strokeWidth="2.6" strokeLinecap="round" />
            <circle cx="16" cy="31" r="4" fill="#202320" />
          </svg>
        );
      case 'birder':
        return (
          <svg viewBox="0 0 48 48" className={svgClass} fill="none">
            <path d="M14 28C14 19 20 13 28 13C33 13 36 17 36 24C36 31 30 35 22 35C16 35 12 32 10 29L14 28Z" fill="#B9CBE0" />
            <path d="M35 19L40 20L35 22Z" fill="#E69A3A" />
            <circle cx="31" cy="18" r="1.7" fill="#202320" />
            <path d="M19 26C22 24 26 25 28 28" stroke="#8BA5C4" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'mammalogist':
        return (
          <svg viewBox="0 0 48 48" className={svgClass} fill="none">
            <path d="M18 35C11 33 9 23 15 16C18 13 21 15 20 20C19 24 21 28 23 30" fill="#B57249" />
            <ellipse cx="27" cy="29" rx="7" ry="8" fill="#C87E4E" />
            <circle cx="29" cy="18" r="5" fill="#C87E4E" />
            <path d="M26 14L27 10L29 14" fill="#A86035" />
            <circle cx="31" cy="17.5" r="1.2" fill="#202320" />
            <circle cx="35" cy="24" r="2.2" fill="#E6C6A8" />
          </svg>
        );
      case 'mycologist':
        return (
          <svg viewBox="0 0 48 48" className={svgClass} fill="none">
            <rect x="20" y="25" width="8" height="12" rx="4" fill="#F6DF9F" />
            <path d="M11 26C11 17 17 11 24 11C31 11 37 17 37 26H11Z" fill="#EF4452" />
            <circle cx="18" cy="19" r="2.3" fill="#FFF7F7" />
            <circle cx="26" cy="16" r="2.6" fill="#FFF7F7" />
            <circle cx="31" cy="22" r="1.8" fill="#FFF7F7" />
          </svg>
        );
      case 'herpetologist':
        return (
          <svg viewBox="0 0 48 48" className={svgClass} fill="none">
            <path d="M14 31C18 28 21 20 27 17C31 15 35 16 36 19C37 22 33 25 28 27C23 29 20 34 14 36" stroke="#1FA38A" strokeWidth="5" strokeLinecap="round" />
            <path d="M23 22L19 18M28 26L33 29" stroke="#1FA38A" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="33" cy="18" r="1.4" fill="#202320" />
          </svg>
        );
      case 'ichthyologist':
        return (
          <svg viewBox="0 0 48 48" className={svgClass} fill="none">
            <path d="M13 24L8 18V30L13 24Z" fill="#4E7DE0" />
            <ellipse cx="25" cy="24" rx="12" ry="7.5" fill="#2F5FD0" />
            <path d="M22 17L26 12L29 17" fill="#5A88EE" />
            <circle cx="31" cy="22.5" r="1.5" fill="#FFFFFF" />
            <circle cx="31.5" cy="22.5" r="0.8" fill="#202320" />
          </svg>
        );
      case 'invertebrates':
        return (
          <svg viewBox="0 0 48 48" className={svgClass} fill="none">
            {/* Cute snail illustration matching A-12_시작완료.png */}
            <path d="M13 34H32C35.5 34 37.5 31.5 36.5 27.5C35.5 23.5 34 19 32 19C30 19 29.5 23 29.5 26C29.5 28.5 27 29.5 23 29.5H13V34Z" fill="#F8C6BF" />
            <line x1="32" y1="19" x2="31" y2="14" stroke="#F4A89F" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="34" y1="19.5" x2="35.5" y2="14.5" stroke="#F4A89F" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="31" cy="13.5" r="1.4" fill="#202320" />
            <circle cx="35.5" cy="14" r="1.4" fill="#202320" />
            <circle cx="21" cy="25.5" r="8.5" fill="#7FA8CE" />
            <path d="M21 25.5C21 23 23 21.5 25 22.5C27 23.5 27 27 24.5 28.5C21.5 30 17.5 28 17.5 24.5C17.5 21 20.5 18.5 24 19" stroke="#5A83AB" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        );
      case 'general':
      default:
        return (
          <svg viewBox="0 0 48 48" className={svgClass} fill="none">
            <circle cx="24" cy="24" r="13" fill="#FFFFFF" stroke="#555C54" strokeWidth="2.4" />
            <polygon points="24,15 27.5,24 24,22.5 20.5,24" fill="#FF5100" />
            <polygon points="24,33 27.5,24 24,25.5 20.5,24" fill="#8C948A" />
            <circle cx="24" cy="24" r="1.8" fill="#202320" />
          </svg>
        );
    }
  };

  return (
    <div className={`${sizeClass} bg-[#f4f5f4] flex items-center justify-center shrink-0 ${className}`}>
      {renderSvg()}
    </div>
  );
};
