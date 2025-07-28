import React from 'react'
import NotFoundImg from "../assets/404.jpg"

const Error = () => {
  return (
    <div>
      <img src={NotFoundImg} alt="Not Found" className='grayscale w-full pt-20 md:pt-6 sm:w-2/3 mx-auto' />
    </div>
  )
}

export default Error
