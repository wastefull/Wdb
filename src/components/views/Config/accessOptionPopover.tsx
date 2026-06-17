import { PopoverContent } from "../../ui/popover";
import {
  Eye,
  GraduationCap,
  LucideProps,
  Moon,
  PersonStanding,
  RotateCcw,
  Sun,
  Type,
  WandSparkles,
} from "lucide-react";
import {
  AccessibilitySettings,
  useAccessibility,
} from "../../shared/AccessibilityContext";
import {
  ForwardRefExoticComponent,
  ReactElement,
  RefAttributes,
  useState,
} from "react";
import { Switch } from "../../ui/switch";

export function AccessOptionPopover({
  oType,
}: {
  oType: "reset" | "fontSize" | "display";
}) {
  return (
    <PopoverContent className="access-popover">
      <div>{accessConfig(oType)}</div>
    </PopoverContent>
  );
}

export function accessHeader(
  ReactElement: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >,
  title: string,
  helpText: string = "",
) {
  return (
    <div className="grid">
      <ReactElement size={16} />
      <h3 className="access-header">{title}</h3>
      {helpText && <div className="access-helptext">{helpText}</div>}
    </div>
  );
}

export function accessConfig(which: "reset" | "fontSize" | "display") {
  const acs = useAccessibility();
  const settings = acs.settings;
  const setFontSize = acs.setFontSize;
  const resetSettings = acs.resetSettings;
  const [open, setOpen] = useState(false);

  switch (which) {
    case "reset":
      return (
        <>
          <div>
            {accessHeader(
              RotateCcw,
              "Reset Settings",
              "Reset all accessibility settings to default",
            )}
          </div>
          <div>
            <button
              onClick={() => {
                resetSettings();
                setOpen(false);
              }}
              className="access-reset-btn"
            >
              Reset All
            </button>
          </div>
        </>
      );

    case "fontSize":
      return (
        <>
          <div>{accessHeader(Type, "Font Size")}</div>
          {(() => {
            const fontSizes: {
              label: "normal" | "large" | "xlarge";
              className: string;
            }[] = [
              { label: "normal", className: "text-[12px]" },
              { label: "large", className: "text-[13px]" },
              { label: "xlarge", className: "text-[14px]" },
            ];
            return fontSizes.map(({ label, className }) => (
              <button
                onClick={() => setFontSize(label)}
                key={label}
                className={`fontsize-button ${className} ${settings.fontSize === label ? "fontsize-button-active" : "fontsize-button-inactive"}`}
              >
                {label}
              </button>
            ));
          })()}
        </>
      );
    case "display":
      return (
        <>
          <div>{accessHeader(Eye, "Display Options")}</div>
          {OptionsPanel()}
        </>
      );
  }
}

export function OptionsPanel() {
  const acs = useAccessibility();
  const settings = acs.settings;
  const toggleHighContrast = acs.toggleHighContrast;
  const toggleNoPastel = acs.toggleNoPastel;
  const toggleReduceMotion = acs.toggleReduceMotion;
  const toggleDarkMode = acs.toggleDarkMode;

  const optionToggles: {
    icon: ReactElement;
    label: string;
    checkedState: boolean;
    checkChange: () => void;
    disabled?: boolean;
  }[] = [
    {
      icon: <Moon size={14} />,
      label: "Dark Mode (temp. unavailable)",
      checkedState: settings.darkMode,
      checkChange: toggleDarkMode,
      disabled: true,
    },
    {
      icon: <WandSparkles size={14} />,
      label: "High Contrast",
      checkedState: settings.highContrast,
      checkChange: toggleHighContrast,
      disabled: false,
    },
    {
      icon: <GraduationCap size={14} />,
      label: "No Pastel",
      checkedState: settings.noPastel,
      checkChange: toggleNoPastel,
      disabled: false,
    },
    {
      icon: <PersonStanding size={14} />,
      label: "Reduce Motion",
      checkedState: settings.reduceMotion,
      checkChange: toggleReduceMotion,
      disabled: false,
    },
  ];
  return (
    <>
      {optionToggles.map(
        ({ icon, label, checkedState, checkChange, disabled }) =>
          optionToggle(icon, label, checkedState, checkChange, disabled),
      )}{" "}
    </>
  );
}

export function optionToggle(
  icon: React.ReactNode | null,
  label: string,
  checkedState: boolean,
  checkChange: () => void,
  disabled?: boolean,
) {
  return (
    <div className="border rounded border-gray-300 py-0.5 px-2">
      <div className="grid grid-cols-4 gap-3">
        <label className="text-[12px] col-span-2">
          {icon}
          {label}
        </label>
        <div className="col-span-1"></div>
        <div className="col-span-1">
          <Switch
            checked={checkedState}
            onCheckedChange={checkChange}
            disabled={disabled || false}
          />
        </div>
      </div>
    </div>
  );
}
