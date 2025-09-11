export type User = {
  fullName: string
  uid: any
  currentUser?: any
  id: any
  name: string
  avatar?: string
  familyId?: string
  isOnline?: boolean
  avatarUrl?:string
  videoCall?:any

}

export type MessageType = "text" | "image" | "video" | "file" | "call_invite"
import { Timestamp } from "firebase/firestore"

export type Usered={
   id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
   familyId?: string
}
export type Message = {
  id?: any
  text?: string
  author: User
  createdAt: any | null
  type?: "text" | "image" | "video" | "file" |  "call_invite"
  fileUrl?: string | null
  file?: {
    name: string
    size: number
  }
  replyAuthorName?: any
  replyPreview?: any 
  replyTo?: any 
  reactions?: Record<string, string>
}

export type Group = {
  id?: string;
  name?:string;
  avatar?: string;
  members?: User[];
  messages?: Message[];
};


export type Currentuser ={
    id: any;
        name: any | null;
        avatar: string;
        familyId: string;
        isOnline: boolean;
}