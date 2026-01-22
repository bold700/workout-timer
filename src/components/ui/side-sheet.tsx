import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

function SideSheet({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="side-sheet" {...props} />
}

function SideSheetTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="side-sheet-trigger" {...props} />
}

function SideSheetPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="side-sheet-portal" {...props} />
}

function SideSheetClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="side-sheet-close" {...props} />
}

function SideSheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="side-sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function SideSheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <SideSheetPortal>
      <SideSheetOverlay />
      <DialogPrimitive.Content
        data-slot="side-sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-md border-l shadow-lg duration-300 outline-none",
          className
        )}
        {...props}
      >
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        {showCloseButton && (
          <SideSheetClose
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SideSheetClose>
        )}
      </DialogPrimitive.Content>
    </SideSheetPortal>
  )
}

function SideSheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="side-sheet-header"
      className={cn("flex flex-col gap-2 pb-4 border-b", className)}
      {...props}
    />
  )
}

function SideSheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="side-sheet-footer"
      className={cn("flex flex-col gap-2 pt-4 border-t mt-4", className)}
      {...props}
    />
  )
}

function SideSheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="side-sheet-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function SideSheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="side-sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  SideSheet,
  SideSheetClose,
  SideSheetContent,
  SideSheetDescription,
  SideSheetFooter,
  SideSheetHeader,
  SideSheetOverlay,
  SideSheetPortal,
  SideSheetTitle,
  SideSheetTrigger,
}
