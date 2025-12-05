import React from 'react';

const paths = {
  target: (
    <path
      d="M12 5.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 10.25a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5Zm0-2.75a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  clock: (
    <>
      <path
        d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </>
  ),
  home: (
    <path
      d="M4.75 11.4 12 4.5l7.25 6.9V19a1 1 0 0 1-1 1h-4.5a.5.5 0 0 1-.5-.5v-4a1.25 1.25 0 0 0-1.25-1.25h-1a1.25 1.25 0 0 0-1.25 1.25v4a.5.5 0 0 1-.5.5H5.75a1 1 0 0 1-1-1v-7.6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  people: (
    <path
      d="M8.5 6.75a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5Zm7 0a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5ZM5 17a3.5 3.5 0 0 1 3.5-3.5h1A3.5 3.5 0 0 1 13 17v.75a1.25 1.25 0 0 1-1.25 1.25h-5.5A1.25 1.25 0 0 1 5 17.75V17Zm10.25-3c.28-.06.57-.1.88-.1h.75A3.12 3.12 0 0 1 20 17v.75a1.25 1.25 0 0 1-1.25 1.25h-2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  calendar: (
    <path
      d="M8 4.75v-1.5M16 4.75v-1.5M5.5 7.5h13m-12.75 0h-1a1.25 1.25 0 0 0-1.25 1.25v9A1.25 1.25 0 0 0 4.5 19h15a1.25 1.25 0 0 0 1.25-1.25v-9A1.25 1.25 0 0 0 19.5 7.5h-1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  ),
  mail: (
    <>
      <path
        d="M5.75 5.5h12.5A1.75 1.75 0 0 1 20 7.25v9.5A1.75 1.75 0 0 1 18.25 18.5H5.75A1.75 1.75 0 0 1 4 16.75v-9.5A1.75 1.75 0 0 1 5.75 5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="m6 7 5.26 3.41a1 1 0 0 0 1.08 0L17.6 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  edit: (
    <>
      <path
        d="m15.5 5.5 2 2-8.25 8.25H7.25v-2.25L15.5 5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="m14.5 6.5 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M6 19h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </>
  ),
  logout: (
    <path
      d="M12 4.75a.75.75 0 0 0-.75-.75H6.75A2.75 2.75 0 0 0 4 6.75v10.5A2.75 2.75 0 0 0 6.75 20h4.5a.75.75 0 0 0 0-1.5h-4.5c-.69 0-1.25-.56-1.25-1.25V6.75c0-.69.56-1.25 1.25-1.25h4.5a.75.75 0 0 0 .75-.75Zm3.47 2.72a.75.75 0 0 0-1.06 1.06l2.22 2.22H10.5a.75.75 0 0 0 0 1.5h6.13l-2.22 2.22a.75.75 0 1 0 1.06 1.06l3.5-3.5a.75.75 0 0 0 0-1.06l-3.5-3.5Z"
      fill="currentColor"
    />
  ),
  sparkles: (
    <path
      d="M12 3.25c-.22 0-.43.12-.53.32l-1.36 2.75-2.87.42a.6.6 0 0 0-.33 1.02l2.07 2.02-.49 2.86a.6.6 0 0 0 .87.64L12 12.4l2.56 1.34a.6.6 0 0 0 .87-.64l-.49-2.86 2.07-2.02a.6.6 0 0 0-.33-1.02l-2.87-.42-1.36-2.75a.6.6 0 0 0-.53-.32Zm-6.5 2.5c-.16 0-.32.09-.39.24l-.83 1.68-1.85.27a.5.5 0 0 0-.28.85l1.34 1.31-.32 1.86a.5.5 0 0 0 .72.53l1.66-.87 1.66.87a.5.5 0 0 0 .72-.53l-.32-1.86 1.34-1.31a.5.5 0 0 0-.28-.85l-1.85-.27-.83-1.68a.44.44 0 0 0-.39-.24Zm13 7c-.16 0-.32.09-.39.24l-.58 1.17-1.3.19a.5.5 0 0 0-.28.85l.94.92-.22 1.29a.5.5 0 0 0 .72.53l1.16-.61 1.16.61a.5.5 0 0 0 .72-.53l-.22-1.29.94-.92a.5.5 0 0 0-.28-.85l-1.3-.19-.58-1.17a.44.44 0 0 0-.39-.24Z"
      fill="currentColor"
    />
  )
};

export default function Icon({ name, size = 18, className }) {
  const path = paths[name] || null;
  if (!path) return null;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}
