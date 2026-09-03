import { useEffect } from 'react';

export function Seo({title,description}:{title:string;description:string}) {
  useEffect(()=>{
    document.title=`${title} | ACS Informática`;
    document.querySelector('meta[name="description"]')?.setAttribute('content',description);
  },[title,description]);
  return null;
}
