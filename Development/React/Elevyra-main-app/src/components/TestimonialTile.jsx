import React from "react";
import { ImQuotesLeft, ImQuotesRight } from "react-icons/im";

const TestimonialTile = ({testimonialData}) => {

  return (
    <div>
      <div className="rounded-md bg-primaryGray text-primaryWhite w-full max-w-2xl mx-auto h-auto p-4 hover:-translate-y-4 transition-all duration-300 cursor-pointer">
        <p>
          <ImQuotesLeft className="text-primaryWhite" /><span className="text-sm md:text-lg"> {testimonialData.comment} </span>
          <ImQuotesRight className="text-primaryWhite" />
        </p>
        <div className="w-full text-end text-sm">
          <h3 className=" font-bold font-mono ">- {testimonialData.name}</h3>
          <p className="italic">{testimonialData.company}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialTile;
