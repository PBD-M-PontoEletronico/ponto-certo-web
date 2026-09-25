import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = 'h-5 w-5 shrink-0';

function Icone(props: IconProps & { children: ReactNode }) {
  const { children, className, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? base}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconeInicio(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7m-9-2v10a1 1 0 001 1h3m6-11l2 2m-8-9v3m0 0h4a1 1 0 011 1v10a1 1 0 01-1 1h-3" />
    </Icone>
  );
}

export function IconeEmpresas(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 21h18M5 21V7a1 1 0 011-1h5a1 1 0 011 1v14M15 21V4a1 1 0 011-1h3a1 1 0 011 1v17M8 9h1m-1 4h1m5-8h1m-1 4h1m-1 4h1" />
    </Icone>
  );
}

export function IconeUsuarios(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87m5-3.13a4 4 0 100-8 4 4 0 000 8zm7 3.13a4 4 0 00-3-3.87M13 8a4 4 0 10-2.4 7.2" />
    </Icone>
  );
}

export function IconeSetores(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </Icone>
  );
}

export function IconeAlocacoes(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </Icone>
  );
}

export function IconeEscalas(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </Icone>
  );
}

export function IconeFeriados(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </Icone>
  );
}

export function IconeAfastamentos(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M13 11a4 4 0 100-8 4 4 0 000 8zM15 8h6" />
    </Icone>
  );
}

export function IconeSair(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m0-9H5a2 2 0 00-2 2v14a2 2 0 002 2h2" />
    </Icone>
  );
}

export function IconeMenu(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </Icone>
  );
}

export function IconeFechar(props: IconProps) {
  return (
    <Icone {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </Icone>
  );
}
