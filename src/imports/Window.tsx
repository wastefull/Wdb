import svgPaths from "./svg-u9rak261y3";

function RetroButtons() {
  return (
    <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0" data-name="Retro Buttons">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[7px] py-[2px] relative size-full">
          <div className="relative shrink-0 size-[12px]" data-name="Cancel/Back">
            <div className="absolute inset-[-8.333%]" style={{ "--fill-0": "rgba(230, 188, 181, 1)", "--stroke-0": "rgba(33, 31, 28, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <circle cx="7" cy="7" fill="var(--fill-0, #E6BCB5)" id="Cancel/Back" r="6.5" stroke="var(--stroke-0, #211F1C)" />
              </svg>
            </div>
          </div>
          <div className="relative shrink-0 size-[12px]" data-name="Minimize">
            <div className="absolute inset-[-8.333%]" style={{ "--fill-0": "rgba(228, 227, 172, 1)", "--stroke-0": "rgba(33, 31, 28, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <circle cx="7" cy="7" fill="var(--fill-0, #E4E3AC)" id="Minimize" r="6.5" stroke="var(--stroke-0, #211F1C)" />
              </svg>
            </div>
          </div>
          <div className="relative shrink-0 size-[12px]" data-name="Maximize">
            <div className="absolute inset-[-8.333%]" style={{ "--fill-0": "rgba(184, 200, 203, 1)", "--stroke-0": "rgba(33, 31, 28, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                <circle cx="7" cy="7" fill="var(--fill-0, #B8C8CB)" id="Maximize" r="6.5" stroke="var(--stroke-0, #211F1C)" />
              </svg>
            </div>
          </div>
          <p className="basis-0 font-['Sniglet:Regular',_sans-serif] grow leading-[25px] min-h-px min-w-px not-italic relative shrink-0 text-[24px] text-black text-center">CARDBOARD</p>
        </div>
      </div>
    </div>
  );
}

function Image() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Image">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Image">
          <path d={svgPaths.p1ae5500} id="Icon" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="h-[42px] min-w-[400px] relative shrink-0 w-full" data-name="Status Bar">
      <div aria-hidden="true" className="absolute border-[#211f1c] border-[0px_0px_1.5px] border-solid inset-0 pointer-events-none" />
      <div className="min-w-inherit size-full">
        <div className="box-border content-stretch flex h-[42px] items-start justify-between min-w-inherit px-[5px] py-0 relative w-full">
          <RetroButtons />
          <Image />
        </div>
      </div>
    </div>
  );
}

function Left() {
  return (
    <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0" data-name="Left">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col items-start px-[10px] py-[20px] relative size-full">
          <p className="font-['Sniglet:Regular',_sans-serif] h-[15px] leading-[15px] not-italic relative shrink-0 text-[12px] text-black w-full">Cardboard is a material made from thick paper stock or heavy paper-pulp. It is often used for making sturdy boxes and packaging materials due to its durability and strength. Cardboard can be single-layered or have multiple layers to enhance its rigidity and protective qualities. It is widely used because it is lightweight, cost-effective, recyclable, and largely compostable. It can also be reused in a wide variety of applications.</p>
        </div>
      </div>
    </div>
  );
}

function Image1() {
  return (
    <div className="mb-[-28px] relative shrink-0 size-[165px]" data-name="Image">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 165 165">
        <g id="Image">
          <path d={svgPaths.p25ac3200} id="Icon" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        </g>
      </svg>
    </div>
  );
}

function ImageWithCredit() {
  return (
    <div className="box-border content-stretch flex flex-col items-center pb-[28px] pt-0 px-0 relative shrink-0" data-name="Image with Credit">
      <Image1 />
      <p className="font-['Sniglet:Regular',_sans-serif] leading-[30px] not-italic relative shrink-0 text-[11px] text-black text-center text-nowrap whitespace-pre">image credit imageguy26</p>
    </div>
  );
}

function Button() {
  return (
    <div className="[grid-area:1_/_1] bg-[#e4e3ac] h-[40px] ml-0 mt-0 relative rounded-[6px] w-[166px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#211f1c] border-solid inset-[-0.5px] pointer-events-none rounded-[6.5px] shadow-[3px_4px_0px_-1px_#000000]" />
      <div className="absolute bottom-0 flex flex-col font-['Sniglet:Regular',_sans-serif] justify-center leading-[0] left-1/2 not-italic text-[13.8px] text-black text-center top-0 translate-x-[-50%] w-[166px]">
        <p className="leading-[40px]">recycle</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="[grid-area:1_/_1] bg-[#e6beb5] h-[40px] ml-0 mt-[43px] relative rounded-[6px] w-[166px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#211f1c] border-solid inset-[-0.5px] pointer-events-none rounded-[6.5px] shadow-[3px_4px_0px_-1px_#000000]" />
      <div className="absolute bottom-0 flex flex-col font-['Sniglet:Regular',_sans-serif] justify-center leading-[0] left-1/2 not-italic text-[13.8px] text-black text-center top-0 translate-x-[-50%] w-[166px]">
        <p className="leading-[40px]">compost</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="[grid-area:1_/_1] bg-[#b8c8cb] h-[40px] ml-0 mt-[86px] relative rounded-[6px] w-[166px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#211f1c] border-solid inset-[-0.5px] pointer-events-none rounded-[6.5px] shadow-[3px_4px_0px_-1px_#000000]" />
      <div className="absolute bottom-0 flex flex-col font-['Sniglet:Regular',_sans-serif] justify-center leading-[0] left-1/2 not-italic text-[13.8px] text-black text-center top-0 translate-x-[-50%] w-[166px]">
        <p className="leading-[40px]">upcycle</p>
      </div>
    </div>
  );
}

function ButtonGroup() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-name="Button Group">
      <Button />
      <Button1 />
      <Button2 />
    </div>
  );
}

function Right() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-full items-center min-h-px min-w-px relative shrink-0" data-name="Right">
      <ImageWithCredit />
      <ButtonGroup />
    </div>
  );
}

function WindowContents() {
  return (
    <div className="content-stretch flex h-[300px] items-center min-h-[300px] relative shrink-0 w-[400px]" data-name="Window Contents">
      <Left />
      <Right />
    </div>
  );
}

export default function Window() {
  return (
    <div className="bg-[#faf7f2] relative rounded-[11.464px] size-full" data-name="Window">
      <div className="flex flex-col items-center max-h-inherit size-full">
        <div className="box-border content-stretch flex flex-col items-center max-h-inherit overflow-clip px-px py-[5px] relative size-full">
          <StatusBar />
          <WindowContents />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#211f1c] border-[1.5px] border-solid inset-[-0.75px] pointer-events-none rounded-[12.214px]" />
    </div>
  );
}