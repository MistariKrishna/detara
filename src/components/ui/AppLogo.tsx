'use client';

import React, { memo, useMemo } from 'react';
import AppIcon from './AppIcon';
import AppImage from './AppImage';

interface AppLogoProps {
  src?: string;
  iconName?: string;
  className?: string;
  onClick?: () => void;
}

const AppLogo = memo(function AppLogo({
  src = '/assets/images/app_logo.png',
  iconName = 'SparklesIcon',
  className = '',
  onClick,
}: AppLogoProps) {

  const containerClassName = useMemo(() => {
    const classes = ['flex items-center'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  return (
    <div className={containerClassName} onClick={onClick}>
      {src ? (
        <AppImage
          src={src}
          alt="Logo"
          width={200} // base width (Next Image requirement)
          height={80}
          priority={true}
          unoptimized={src.endsWith('.svg')}
          className="
            h-10
            sm:h-12
            md:h-14
            lg:h-16
            xl:h-20
            w-auto
            object-contain
            flex-shrink-0
          "
        />
      ) : (
        <AppIcon
          name={iconName}
          className="
            h-6
            sm:h-8
            md:h-10
            lg:h-12
            w-auto
            flex-shrink-0
          "
        />
      )}
    </div>
  );
});

export default AppLogo;