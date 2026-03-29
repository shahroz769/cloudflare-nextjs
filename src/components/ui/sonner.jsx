// @ts-nocheck
"use client"

import { Toaster as Sonner } from "sonner"

function Toaster({ ...props }) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        style: { width: '320px', backgroundColor: 'var(--color-card)' },
        className: 'max-w-[320px]',
        classNames: {
          toast:
            "group toast !bg-card !text-foreground !border-border shadow-lg rounded-xl font-sans",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "!bg-primary !text-primary-foreground rounded-lg font-semibold px-4 py-2 shrink-0 ms-auto border border-primary shadow-md",
          cancelButton:
            "!bg-secondary !text-muted-foreground rounded-lg border border-border",
          success:
            "!border-success/25 !bg-card",
          error:
            "!border-destructive/25 !bg-card",
          icon: "group-[.toast]:text-primary",
          closeButton: "!bg-card !text-muted-foreground !border-border hover:!bg-muted",
        },
      }}
      richColors
      closeButton={false}
      position="bottom-center"
      expand={false}
      duration={3000}
      {...props}
    />
  )
}

export { Toaster }
