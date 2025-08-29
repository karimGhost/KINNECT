"use client";
import useClipboard from "react-use-clipboard";
import { useToast } from "@/hooks/use-toast";
import { CopyCheck } from "lucide-react"; // or wherever your icon is from
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
export default function ShareDropdown({ shareUrl }: { shareUrl: string }) {
  const [isCopied, setCopied] = useClipboard(shareUrl, {
    successDuration: 2000,
  });
  const {toast} = useToast();

  return (
    <DropdownMenuItem
      onClick={() => {
        setCopied(); // 🔥 just call this, no argument needed
      
           toast({
          title: "Link copied ",
          description: "Link copied to clipboard",
         
        });
      }}
    >
     <div style={{display:"flex", justifyContent:"center"}}>
      <CopyCheck className="mr-2 mt-1 h-4 w-4" />
      {isCopied ? "Copied!" : "Copy Link"}
      </div> 
    </DropdownMenuItem>
  );
}
