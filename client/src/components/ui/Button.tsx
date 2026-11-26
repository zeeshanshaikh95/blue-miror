import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { withTrailingSlash } from '@/utils/link';

import { buttonClasses, type ButtonVariant } from './button-styles';

type ButtonLinkProps = {
  to: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

export function ButtonLink({ to, children, variant = 'primary', className }: ButtonLinkProps) {
  return (
    <Link to={withTrailingSlash(to)} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}

type ButtonAnchorProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  external?: boolean;
};

export function ButtonAnchor({
  href,
  children,
  variant = 'primary',
  className,
  external = false,
}: ButtonAnchorProps) {
  return (
    <a
      href={href}
      className={buttonClasses(variant, className)}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  className,
  type = 'button',
  disabled,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses(variant, className)}
    >
      {children}
    </button>
  );
}
