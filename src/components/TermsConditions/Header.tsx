
import React from "react";
import { ArrowBigLeft } from "lucide-react";
import { Button } from "../ui/button";

export default function Header({ setTerms }: { setTerms: React.Dispatch<React.SetStateAction<boolean>> })  {

function sets(){
  setTerms(false)
}

return(

    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 " style={{zIndex:"1"}}>


<div style={{position:"relative", padding:"0px", display:"flex"}}>
  <Button onClick={() => sets()}>
      <ArrowBigLeft />

  </Button>
  {/* <BlabzioLogo  style={{width:"40px", height:"40px"}}  className="h-9 w-9 justify m-auto" /> */}

           </div>     
      <h1 className="text-3xl font-bold text-primary mt-1">KINNECT </h1>

</header>

                )
                
                
                }