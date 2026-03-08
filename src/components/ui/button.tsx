import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'ui-button--default',
  secondary: 'ui-button--secondary',
  outline: 'ui-button--outline',
  ghost: 'ui-button--ghost'
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'ui-button--md',
  sm: 'ui-button--sm',
  lg: 'ui-button--lg',
  icon: 'ui-button--icon'
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      className={cn('ui-button', variantClasses[variant], sizeClasses[size], className)}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button };
