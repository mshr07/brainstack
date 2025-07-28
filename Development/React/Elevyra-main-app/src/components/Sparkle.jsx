"use client";
import React from "react";
import { SparkleAnim } from "./ui/SparkleAnim";

export function Sparkle(props) {
  return (
    (<div
      className=" w-full  flex flex-col items-center justify-center overflow-hidden rounded-md">
      <h1
        className="text-xl sm:text-2xl md:text-5xl font-bold text-center text-white relative z-20">
        {props.text}
      </h1>
      <div className="w-[40rem] h-6 relative">
        {/* Gradients */}
        <div
          className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
        <div
          className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
        <div
          className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
        <div
          className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

        {/* Core component */}
        <SparkleAnim
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={1200}
          className="w-full h-full"
          particleColor="#FFFFFF" />

      </div>
    </div>)
  );
}
