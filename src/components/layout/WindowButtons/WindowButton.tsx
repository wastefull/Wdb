import { Dispatch, SetStateAction } from "react";
import { AccessibilitySettings } from "../../shared/AccessibilityContext";
import { Popover } from "../../ui/popover";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";
import { CircleButton } from "../../ui/circle-button.tsx";
import { AccessOptionPopover } from "../../views/Config/accessOptionPopover.tsx";

export function WindowButton({
  openState,
  openChange,
  className,
  oType: type,
  settings,
}: {
  openState: boolean;
  openChange: Dispatch<SetStateAction<boolean>>;
  className: string;
  oType: "reset" | "fontSize" | "display";
  settings: AccessibilitySettings;
}) {
  const ariaLabel = `${type} settings`;
  return (
    <>
      <UITooltip>
        <TooltipTrigger asChild>
          <div className="access-btn">
            <Popover open={openState} onOpenChange={openChange}>
              <CircleButton
                ariaLabel={ariaLabel}
                className={className}
                settings={settings}
              />
              <TooltipContent
                side="bottom"
                className="bg-black text-white border-black"
              >
                <p className="text-sm">{ariaLabel}</p>
              </TooltipContent>
              <AccessOptionPopover oType={type} />
            </Popover>
          </div>
        </TooltipTrigger>
      </UITooltip>
    </>
  );
}
