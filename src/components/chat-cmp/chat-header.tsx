import React from "react";
const ChatHeader = () => {
  return (
    <div className="w-full hidden md:block relative">
      <div
        className="absolute overflow-hidden transition-[top] duration-100 ease-snappy grid place-items-center -right-3 has-[.sidebar-check:checked]:-top-20 top-0 !z-50 h-16 w-40 max-sm:hidden"
        style={{ clipPath: "inset(0px 12px 0px 0px)" }}
      >
        <input
          className="hidden sidebar-check"
          type="checkbox"
          name="sidebar-check"
        />
        <div className="group pointer-events-none absolute top-3.5 z-10 -mb-8 h-32 w-full origin-top ease-snappy">
          <svg
            className="absolute  h-9 origin-top-left skew-x-[30deg] overflow-visible"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 128 32"
            xmlSpace="preserve"
          >
            <line
              stroke="hsl(var(--background))"
              strokeWidth="2px"
              shapeRendering="optimizeQuality"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeMiterlimit="10"
              x1="1"
              y1="0"
              x2="128"
              y2="0"
            ></line>
            <path
              stroke="hsl(var(--chat-border))"
              className="translate-y-[0.5px]"
              fill="hsl(var(--background))"
              shapeRendering="optimizeQuality"
              strokeWidth="1px"
              strokeLinecap="round"
              strokeMiterlimit="10"
              vectorEffect="non-scaling-stroke"
              d="M0,0c5.9,0,10.7,4.8,10.7,10.7v10.7c0,5.9,4.8,10.7,10.7,10.7H128V0"
            ></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
