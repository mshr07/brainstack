import React, {useEffect} from 'react'
import FormComp from '../../components/FormComp'
import { BackgroundBeamsWithCollision } from "../../components/ui/bg-beams";


const Register = () => {
    // Scroll to top on page load
    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

  return (
    <BackgroundBeamsWithCollision>
      <FormComp />
    </BackgroundBeamsWithCollision>
  )
}

export default Register
