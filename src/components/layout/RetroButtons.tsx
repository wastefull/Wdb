import { useState } from "react";
import { RotateCcw, Type, Eye, Moon, Unlock, Settings } from "lucide-react";
import { useAccessibility } from "../shared/AccessibilityContext";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Switch } from "../ui/switch";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

export interface RetroButtonsProps {
  title: string;
}

export function RetroButtons({ title }: RetroButtonsProps) {
  const {
    settings,
    setFontSize,
    toggleHighContrast,
    toggleNoPastel,
    toggleReduceMotion,
    toggleDarkMode,
    togglePrioritizeOA,
    resetSettings,
  } = useAccessibility();
  const [redOpen, setRedOpen] = useState(false);
  const [yellowOpen, setYellowOpen] = useState(false);
  const [blueOpen, setBlueOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  return (
    <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
      <div className="flex flex-row items-center justify-start md:justify-center size-full">
        <div className="box-border content-stretch flex gap-1 md:gap-2.5 items-center justify-start md:justify-center px-[3px] md:px-[7px] py-0.5 relative size-full">
          {/* Mobile: Single accessibility button */}
          <div className="md:hidden">
            <Sheet
              open={mobileSettingsOpen}
              onOpenChange={setMobileSettingsOpen}
            >
              <SheetTrigger asChild>
                <button
                  className="relative w-[15px] h-[15px] hover:scale-110 transition-transform"
                  aria-label="Accessibility settings"
                >
                  {/* Retro circle button background */}
                  <div
                    className={`absolute inset-[-8.333%] arcade-fill-cyan ${
                      settings.noPastel ? "opacity-80" : ""
                    }`}
                  >
                    <svg
                      className="block size-full"
                      fill="none"
                      preserveAspectRatio="none"
                      viewBox="0 0 14 14"
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
                  <Settings className="absolute inset-0 m-auto w-[9px] h-[9px] text-[#211f1c]" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="bg-[#faf7f2] dark:bg-[#2a2825] border-t-[1.5px] border-[#211f1c] dark:border-white/20 rounded-t-xl px-6"
                aria-describedby={undefined}
              >
                <SheetHeader className="border-b border-[#211f1c]/20 dark:border-white/20 pb-4">
                  <SheetTitle className="text-center font-display">
                    Accessibility
                  </SheetTitle>
                </SheetHeader>
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
                          Dark Mode
                        </label>
                        <Switch
                          checked={settings.darkMode}
                          onCheckedChange={toggleDarkMode}
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
                  <div className="border-t border-[#211f1c]/10 dark:border-white/10 pt-3">
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
                    <p className="text-[11px] text-black/60 dark:text-white/60 mt-1">
                      Show open access sources first
                    </p>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={() => {
                      resetSettings();
                      setMobileSettingsOpen(false);
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

          {/* Desktop: Three separate buttons */}
          <TooltipProvider delayDuration={300}>
            <div className="hidden md:flex flex-row gap-2.5 items-center h-full">
              {/* Red Button - Reset Settings */}
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="relative shrink-0 w-[13px] h-[13px] overflow-visible flex items-center justify-center">
                    <Popover open={redOpen} onOpenChange={setRedOpen}>
                      <PopoverTrigger
                        className="relative size-full hover:scale-110 transition-transform cursor-pointer"
                        aria-label="Reset accessibility settings"
                      >
                        <div
                          className={`absolute inset-[-8.333%] arcade-fill-red ${
                            settings.noPastel ? "opacity-80" : ""
                          }`}
                        >
                          <svg
                            className="block size-full"
                            fill="none"
                            preserveAspectRatio="none"
                            viewBox="0 0 14 14"
                          >
                            <circle
                              cx="7"
                              cy="7"
                              fill="var(--fill-0, #E6BCB5)"
                              r="6.5"
                              stroke="var(--stroke-0, #211F1C)"
                            />
                          </svg>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] rounded-[11.464px] shadow-[3px_4px_0px_-1px_#000000]">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <RotateCcw size={16} />
                            <h3 className="text-[14px]">Reset Settings</h3>
                          </div>
                          <p className="text-[11px] text-black/70 dark:text-white/70">
                            Reset all accessibility settings to default
                          </p>
                          <button
                            onClick={() => {
                              resetSettings();
                              setRedOpen(false);
                            }}
                            className="w-full bg-waste-compost h-9 rounded-[6px] border border-[#211f1c] shadow-[2px_2px_0px_0px_#000000] text-[12px] text-black hover:translate-y-px hover:shadow-[1px_1px_0px_0px_#000000] transition-all flex items-center justify-center"
                          >
                            Reset All
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-black text-white border-black"
                >
                  <p className="text-[11px]">Reset accessibility</p>
                </TooltipContent>
              </UITooltip>

              {/* Yellow Button - Font Size */}
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="relative shrink-0 w-[13px] h-[13px] overflow-visible flex items-center justify-center">
                    <Popover open={yellowOpen} onOpenChange={setYellowOpen}>
                      <PopoverTrigger
                        className="relative size-full hover:scale-110 transition-transform cursor-pointer"
                        aria-label="Font size settings"
                      >
                        <div
                          className={`absolute inset-[-8.333%] arcade-fill-amber ${
                            settings.noPastel ? "opacity-80" : ""
                          }`}
                        >
                          <svg
                            className="block size-full"
                            fill="none"
                            preserveAspectRatio="none"
                            viewBox="0 0 14 14"
                          >
                            <circle
                              cx="7"
                              cy="7"
                              fill="var(--fill-0, #E4E3AC)"
                              r="6.5"
                              stroke="var(--stroke-0, #211F1C)"
                            />
                          </svg>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] rounded-[11.464px] shadow-[3px_4px_0px_-1px_#000000]">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Type size={16} />
                            <h3 className="text-[14px]">Font Size</h3>
                          </div>
                          <div className="space-y-2">
                            <button
                              onClick={() => setFontSize("normal")}
                              className={`w-full h-9 rounded-[6px] border border-[#211f1c] text-[12px] dark:text-white transition-all flex items-center justify-center ${
                                settings.fontSize === "normal"
                                  ? "bg-waste-recycle text-black shadow-[2px_2px_0px_0px_#000000]"
                                  : "bg-white dark:bg-[#2a2825] hover:bg-waste-recycle/20"
                              }`}
                            >
                              Normal
                            </button>
                            <button
                              onClick={() => setFontSize("large")}
                              className={`w-full h-9 rounded-[6px] border border-[#211f1c] text-[13px] dark:text-white transition-all flex items-center justify-center ${
                                settings.fontSize === "large"
                                  ? "bg-waste-recycle text-black shadow-[2px_2px_0px_0px_#000000]"
                                  : "bg-white dark:bg-[#2a2825] hover:bg-waste-recycle/20"
                              }`}
                            >
                              Large
                            </button>
                            <button
                              onClick={() => setFontSize("xlarge")}
                              className={`w-full h-9 rounded-[6px] border border-[#211f1c] text-[14px] dark:text-white transition-all flex items-center justify-center ${
                                settings.fontSize === "xlarge"
                                  ? "bg-waste-recycle text-black shadow-[2px_2px_0px_0px_#000000]"
                                  : "bg-white dark:bg-[#2a2825] hover:bg-waste-recycle/20"
                              }`}
                            >
                              Extra Large
                            </button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-black text-white border-black"
                >
                  <p className="text-[11px]">Font size</p>
                </TooltipContent>
              </UITooltip>

              {/* Blue Button - Display Controls */}
              <UITooltip>
                <TooltipTrigger asChild>
                  <div className="relative shrink-0 w-[13px] h-[13px] overflow-visible flex items-center justify-center">
                    <Popover open={blueOpen} onOpenChange={setBlueOpen}>
                      <PopoverTrigger
                        className="relative size-full hover:scale-110 transition-transform cursor-pointer"
                        aria-label="Display settings"
                      >
                        <div
                          className={`absolute inset-[-8.333%] arcade-fill-cyan ${
                            settings.noPastel ? "opacity-80" : ""
                          }`}
                        >
                          <svg
                            className="block size-full"
                            fill="none"
                            preserveAspectRatio="none"
                            viewBox="0 0 14 14"
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
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4 bg-white dark:bg-[#1a1917] border-[1.5px] border-[#211f1c] rounded-[11.464px] shadow-[3px_4px_0px_-1px_#000000]">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Eye size={16} />
                            <h3 className="text-[14px]">Display</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[12px] flex items-center gap-2">
                                <Moon size={14} />
                                Dark Mode
                              </label>
                              <Switch
                                checked={settings.darkMode}
                                onCheckedChange={toggleDarkMode}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-[12px]">
                                High Contrast
                              </label>
                              <Switch
                                checked={settings.highContrast}
                                onCheckedChange={toggleHighContrast}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-[12px]">No Pastel</label>
                              <Switch
                                checked={settings.noPastel}
                                onCheckedChange={toggleNoPastel}
                                disabled={settings.highContrast}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-[12px]">
                                Reduce Motion
                              </label>
                              <Switch
                                checked={settings.reduceMotion}
                                onCheckedChange={toggleReduceMotion}
                              />
                            </div>
                            <div className="border-t border-[#211f1c]/10 dark:border-white/10 pt-3 mt-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[12px] flex items-center gap-2">
                                  <Unlock size={14} />
                                  Prioritize Open Access
                                </label>
                                <Switch
                                  checked={settings.prioritizeOA}
                                  onCheckedChange={togglePrioritizeOA}
                                />
                              </div>
                              <p className="caption">
                                Curator preference: show OA sources first
                              </p>
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-black text-white border-black"
                >
                  <p className="text-[11px]">Display options</p>
                </TooltipContent>
              </UITooltip>
            </div>
          </TooltipProvider>

          <div className="basis-0 grow min-h-px min-w-px flex items-center justify-center">
            <h1 className="leading-[25px] not-italic uppercase">{title}</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
