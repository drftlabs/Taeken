"use client";
import { openTrack } from "./TrackModal";
export default function TrackOpen({ className, children }) { return <button type="button" className={className} onClick={openTrack}>{children}</button>; }
