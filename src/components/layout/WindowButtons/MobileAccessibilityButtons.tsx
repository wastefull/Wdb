import { Sheet, SheetContent, SheetTrigger } from "../../ui/sheet";
import { Dispatch, SetStateAction } from "react";
import { SheetHeader, SheetTitle } from "../../ui/sheet";
import { RotateCcw, Settings, Type, Eye } from "lucide-react";
import { Moon } from "lucide-react";
import { useAccessibility } from "../../shared/AccessibilityContext";
import { Switch } from "../../ui/switch";
// Todo: use same implementation style as WindowButtons/accessOptionpopover
export function MobileAccessibilityButtons({
  open,
  setMobile,
}: {
  open: boolean;
  setMobile: Dispatch<SetStateAction<boolean>>;
}) {
  const {
    settings,
    setFontSize,
    toggleHighContrast,
    toggleNoPastel,
    toggleReduceMotion,
    toggleDarkMode,
    resetSettings,
  } = useAccessibility();
  return (
    <>
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setMobile}>
          <SheetTrigger asChild>
            <button
              className="relative block w-4 h-4 shrink-0 leading-none scale-110 transition-transform"
              aria-label="Accessibility settings"
            >
              {/* Retro circle button background */}
              <div
                className={`absolute inset-[-6.25%] arcade-fill-cyan ${
                  settings.noPastel ? "opacity-80" : ""
                }`}
              >
                <svg
                  className="block size-full"
                  fill="none"
                  preserveAspectRatio="none"
                  viewBox="-0.5 -0.5 15 15"
                >
                  <circle
                    cx="7"
                    cy="7"
                    fill="var(--fill-0, #B8C8CB)"
                    r="6.5"
                    stroke="var(--stroke-0, #211F1C)"
                  />
                </svg>
              </div>
              {/* Gear icon centered */}
              <Settings className="absolute left-1/2 top-1/2 w-2.25 h-2.25 -translate-x-1/2 -translate-y-1/2 text-[#211f1c]" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="top"
            className="sheet-content"
            aria-describedby="accessibility-settings-description"
          >
            <SheetHeader className="sheet-header">
              <SheetTitle className="text-center font-display">
                Accessibility
              </SheetTitle>
            </SheetHeader>
            <div id="accessibility-settings-description" className="sr-only">
              Adjust accessibility settings such as font size, contrast, and
              motion preferences.
            </div>
            <div className="flex flex-col gap-4 p-4">
              {/* Font Size Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Type size={16} />
                  <h3 className="text-[14px] font-medium">Font Size</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFontSize("normal")}
                    className={`flex-1 h-9 rounded-[6px] border border-[#211f1c] text-[12px] dark:text-white transition-all flex items-center justify-center ${
                      settings.fontSize === "normal"
                        ? "bg-waste-recycle text-black shadow-[2px_2px_0px_0px_#000000]"
                        : "bg-white dark:bg-[#2a2825] hover:bg-waste-recycle/20"
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setFontSize("large")}
                    className={`flex-1 h-9 rounded-[6px] border border-[#211f1c] text-[13px] dark:text-white transition-all flex items-center justify-center ${
                      settings.fontSize === "large"
                        ? "bg-waste-recycle text-black shadow-[2px_2px_0px_0px_#000000]"
                        : "bg-white dark:bg-[#2a2825] hover:bg-waste-recycle/20"
                    }`}
                  >
                    Large
                  </button>
                  <button
                    onClick={() => setFontSize("xlarge")}
                    className={`flex-1 h-9 rounded-[6px] border border-[#211f1c] text-[14px] dark:text-white transition-all flex items-center justify-center ${
                      settings.fontSize === "xlarge"
                        ? "bg-waste-recycle text-black shadow-[2px_2px_0px_0px_#000000]"
                        : "bg-white dark:bg-[#2a2825] hover:bg-waste-recycle/20"
                    }`}
                  >
                    XL
                  </button>
                </div>
              </div>

              {/* Display Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Eye size={16} />
                  <h3 className="text-[14px] font-medium">Display</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] flex items-center gap-2">
                      <Moon size={14} />
                      Dark Mode <small>(temporarily not available)</small>
                    </label>
                    <Switch
                      checked={settings.darkMode}
                      onCheckedChange={toggleDarkMode}
                      disabled={true}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[13px]">High Contrast</label>
                    <Switch
                      checked={settings.highContrast}
                      onCheckedChange={toggleHighContrast}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[13px]">No Pastel</label>
                    <Switch
                      checked={settings.noPastel}
                      onCheckedChange={toggleNoPastel}
                      disabled={settings.highContrast}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[13px]">Reduce Motion</label>
                    <Switch
                      checked={settings.reduceMotion}
                      onCheckedChange={toggleReduceMotion}
                    />
                  </div>
                </div>
              </div>

              {/* Open Access Preference */}
              {/* TODO: move this into search filters */}
              {/* <div className="border-t border-[#211f1c]/10 dark:border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                    <label className="text-[13px] flex items-center gap-2">
                    <Unlock size={14} />
                    Prioritize Open Access
                    </label>
                    <Switch
                    checked={settings.prioritizeOA}
                    onCheckedChange={togglePrioritizeOA}
                    />
                    </div>
                    <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                    Show open access sources first
                    </p>
                    </div> */}

              {/* Reset Button */}
              <button
                onClick={() => {
                  resetSettings();
                  setMobile(false);
                }}
                className="w-full bg-waste-compost h-10 rounded-[6px] border border-[#211f1c] shadow-[2px_2px_0px_0px_#000000] text-[13px] text-black hover:translate-y-px hover:shadow-[1px_1px_0px_0px_#000000] transition-all flex items-center justify-center gap-2 mt-2"
              >
                <RotateCcw size={14} />
                Reset All Settings
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
