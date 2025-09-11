export type User = {
  uid: any;
  isAdmin: any;
  familyName: string;
  approved: unknown;
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  originalName:string;
familyCountry:string;
inFamily:any;

  age: any;
  gender: "Male" | "Female" | "Other" | "Prefer not to say";
  ethnicity: string;
  location: {
    city: string;
    country: string;
  };
  createdAt: any;
phoneNumber:any;
avatar:any;
name:any;
  bio: string;
  familyId: string;
  role: "admin" | "member";
  status: "approved" | "pending";
};

      

        



export type Family = {
  id: string;
  name: string;
  origin: string;
  adminId: string;
    familyId: string;

};

export type Comment = {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
};

export type Post = {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  comments: Comment[];
};
