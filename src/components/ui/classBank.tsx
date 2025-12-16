export const classBank = {
  badges: {
    variant: {
      outline: {
        base: { text: { size: "text-[8px]" } },
        light: {
          text: {
            color: "text-blue-700",
          },
          bgColor: "bg-blue-50",
        },
        dark: {
          text: {
            color: "dark:text-blue-300",
          },
          bgColor: "dark:bg-blue-900/20",
        },
      },
    },
  },
  buttons: {
    baseClasses: {
      alignmentClasses:
        "inline-flex items-center justify-center gap-2 whitespace-nowrap",
      shapeClasses: "rounded-md",
      textClasses: "text-sm font-medium",
      transitionClasses:
        "transition-all disabled:pointer-events-none disabled:opacity-50",
      svgClasses:
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
      focusClasses:
        "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      invalidClasses:
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    },
    defaultClasses: {
      bgColor: "bg-primary",
      textColor: "text-primary-foreground",
      hoverBgColor: "hover:bg-primary/90",
    },
    destructiveClasses: {
      bgColor: "bg-destructive dark:bg-destructive/60",
      textColor: "text-white",
      hoverBgColor: "hover:bg-destructive/90",
      focusRingColor:
        "focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
    },
    outlineClasses: {
      bgColor: "bg-background",
      textColor: "text-foreground",
      border:
        "border border-solid border-[#211f1c] dark:border-white/20 dark:bg-input/30",
      hoverBgColor:
        "hover:bg-accent hover:text-accent-foreground dark:hover:bg-input/50",
    },
    secondaryClasses: {
      bgColor: "bg-secondary",
      textColor: "text-secondary-foreground",
      hoverBgColor: "hover:bg-secondary/80",
    },
    ghostClasses: {
      hoverBgColor: "hover:bg-accent dark:hover:bg-accent/50",
      hoverTextColor: "hover:text-accent-foreground",
    },
    linkClasses: {
      textColor: "text-primary",
      hoverTextDecoration: "underline-offset-4 hover:underline",
    },
    size: {
      default: "h-9 px-4 py-2 has-[>svg]:px-3",
      sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
      lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
      icon: "size-9 rounded-md",
    },
  },
  cards: {
    flat: "mt-2 p-4 bg-white dark:bg-[#1a1918] border border-[#211f1c] dark:border-white/20",
  },
  checkbox: {
    root: {
      normal: {
        all: {
          mysteryClass: "peer",
          border: "border outline-none",
          shadow: "shadow-xs transition-shadow",
          shape: "rounded-lg",
          size: "size-4",
          shrink: "shrink-0",
        },
        light: {
          bgColor: "bg-input-background ",
        },
        dark: {
          bgColor: "dark:bg-input/30",
        },
      },
      checked: {
        base: {
          border: "data-[state=checked]:border-primary",
        },
        light: {
          bgColor: "data-[state=checked]:bg-primary",
          textColor: "data-[state=checked]:text-primary-foreground",
        },
        dark: {
          darkBgColor: "dark:data-[state=checked]:bg-primary",
        },
      },
      focus: {
        all: {
          border: "focus-visible:border-ring",
          ring: "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        },
      },
      invalid: {
        all: {
          border: "aria-invalid:border-destructive",
          ring: "aria-invalid:ring-destructive/20",
        },
        dark: {
          ring: "dark:aria-invalid:ring-destructive/40",
        },
      },
      focusVisible: {
        all: {
          ring: "focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        },
      },
      disabled: {
        all: {
          cursor: "disabled:cursor-not-allowed",
          opacity: "disabled:opacity-50",
        },
      },
    },
    indicator: {
      layout: "flex items-center justify-center",
      size: "size-3.5",
      textColor: "text-current",
      transition: "transition-none",
    },
  },
  icons: {
    checkIcon: {
      size: "size-3.5",
    },
    confidence: {
      size: { all: "w-4 h-4" },
      level: {
        high: {
          light: { text: "text-green-700" },
          dark: { text: "dark:text-green-400" },
        },
        medium: {
          light: { text: "text-amber-600" },
          dark: { text: "dark:text-amber-400" },
        },
        low: {
          light: { text: "text-red-600" },
          dark: { text: "dark:text-red-400" },
        },
      },
      margin: { all: "ml-auto" },
    },
  },
  statuses: {
    all: {
      size: "size-5",
    },
    pending: {
      textColor: "text-yellow-600",
    },
    review: {
      textColor: "text-blue-600",
      animate: "animate-spin",
    },
    resolved: {
      textColor: "text-green-600",
    },
    rejected: {
      textColor: "text-red-600",
    },
  },
};
// Utility function to combine class names
// Example usage:
// // Objects only
// classes(classBank.statuses.all, classBank.statuses.pending)
// // → "size-5 text-yellow-600"

// // Strings only
// classes("mt-4", "p-2")
// // → "mt-4 p-2"

// // Mixed - objects and strings
// classes(classBank.statuses.all, classBank.statuses.pending, "animate-pulse")
// // → "size-5 text-yellow-600 animate-pulse"

// // Conditionals
// classes(classBank.icons.confidence.size, isHigh && "text-green-500")
// // Note: falsy values will appear as "false"

export const classes = (
  ...args: (Record<string, unknown> | string)[]
): string =>
  args
    .flatMap((arg) =>
      typeof arg === "string"
        ? arg
        : Object.values(arg).flatMap((v) =>
            typeof v === "object" && v
              ? classes(v as Record<string, unknown>)
              : v
          )
    )
    .join(" ");

export const styles = {
  flexItems: "flex items-start gap-4",
  flexCenter: "max-w-2xl mx-auto flex items-center justify-center py-12",
  autoFlex: "max-w-2xl mx-auto space-y-4",
  spinnerSize8: "size-8 animate-spin text-muted-foreground",
  flexContainerJustifyBetween: "flex items-center justify-between",
  flex2: "max-w-2xl mx-auto space-y-6 ",
  spinnerSize4: "size-4 animate-spin",
  size5: "size-5",
  size4: "size-4",
  arrowLeft: "size-4 mr-2",
  gap3CenterItems: "flex items-center gap-3",
  smallMuted: "text-sm text-muted-foreground",
  flex1: "flex-1",
  flexGap4: "flex items-start gap-4",
  spaceY6: "space-y-6",
  spaceY4: "space-y-4",
  smallDiscList: "list-disc list-inside mt-2 space-y-1 text-sm",
  smallMT2: "mt-2 text-sm",
  flexGap3: "flex gap-3",
  smallSpaceY2: "space-y-2 text-sm",
  gray600: "text-gray-600",
  roundMutedP4: "bg-muted p-4 rounded-lg",
  semiBoldMB2: "font-semibold mb-2",
  mb4: "mb-4",
  textSm: "text-sm",
  checkboxIndicator:
    "flex items-center justify-center text-current transition-none",
  flexWrapGap1Pl2: "flex flex-wrap gap-1 pl-2",
  flexJustifyCenterMB1: "flex justify-between items-center mb-1",
  BW60: "text-black/60 dark:text-white/60",
  BW: "normal",
  med: "font-medium",
  PL2: "pl-2",
  scientificMetadataLayout: "flex items-center gap-2 mb-2",
  metaDataViewStyles:
    "flex items-center gap-2 p-3 arcade-bg-green arcade-btn-green border border-[#211f1c] dark:border-white/20 rounded-md hover:shadow-[2px_2px_0px_0px_#000000] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] transition-all",
  wFull: "w-full",
  w4h4: "w-4 h-4",
  mlAuto: "ml-auto",
};
