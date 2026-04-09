import { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const baseStyles = 'font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900';

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-600 focus:ring-primary-500',
  secondary: 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white focus:ring-neutral-500',
  success: 'bg-success-600 hover:bg-success-700 text-white dark:bg-success-500 dark:hover:bg-success-600 focus:ring-success-500',
  danger: 'bg-danger-600 hover:bg-danger-700 text-white dark:bg-danger-500 dark:hover:bg-danger-600 focus:ring-danger-500',
  ghost: 'text-neutral-600 hover:bg-neutral-100 dark:text-slate-300 dark:hover:bg-slate-700 focus:ring-neutral-500',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  children,
  onClick,
  disabled = false,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        fullWidth && 'w-full',
        className
      )}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      {loading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4"
        >
          ⏳
        </motion.div>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </motion.button>
  );
}