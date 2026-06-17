import { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { useAccessibility } from "../../shared/AccessibilityContext";
import { TooltipProvider } from "../../ui/tooltip";
import { WindowButton } from "./WindowButton";

export function WindowsButtons() {
  const { settings } = useAccessibility();
  const [redOpen, setRedOpen] = useState(false);
  const [yellowOpen, setYellowOpen] = useState(false);
  const [blueOpen, setBlueOpen] = useState(false);
  const buttons: {
    key: string;
    value: {
      open: boolean;
      setOpen: Dispatch<SetStateAction<boolean>>;
      class: string;
    };
    oType: "reset" | "fontSize" | "display";
  }[] = [
    {
      key: "red",
      value: { open: redOpen, setOpen: setRedOpen, class: "arcade-fill-red" },
      oType: "reset",
    },
    {
      key: "yellow",
      value: {
        open: yellowOpen,
        setOpen: setYellowOpen,
        class: "arcade-fill-amber",
      },
      oType: "fontSize",
    },
    {
      key: "blue",
      value: {
        open: blueOpen,
        setOpen: setBlueOpen,
        class: "arcade-fill-cyan",
      },
      oType: "display",
    },
  ];
  return (
    <>
      <TooltipProvider delayDuration={300}>
        <div className="access-btn-group">
          {buttons.map(({ value, oType }) => (
            <WindowButton
              openState={value.open}
              openChange={value.setOpen}
              className={value.class}
              oType={oType}
              settings={settings}
            />
          ))}
        </div>
      </TooltipProvider>
    </>
  );
}
