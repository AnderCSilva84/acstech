import { useEffect } from 'react';

export function Seo({title,description}:{title:string;description:string}) {
  useEffect(()=>{
    document.title=`${title} | ACS Tecnologia`;
    document.querySelector('meta[name="description"]')?.setAttribute('content',description);
  },[title,description]);
  return null;
}
