const paths:Record<string,string> = {
  documents:'M8 3h10l6 6v18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M18 3v6h6 M11 17h10 M11 22h10 M11 12h5',
  hall:'M5 26h22 M8 26V14l9-8 9 8v12 M13 26v-7h6v7 M16 6v3',
  transport:'M4 20h2l2-6h13l3 6h2v5H4z M9 25a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M22 25a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M8 14v-4h9v4',
  cremation:'M16 4c-3 4-5 6.5-5 9.5a5 5 0 0 0 10 0C21 10.5 19 8 16 4z M9 20c0 6 3 8 7 8s7-2 7-8',
  thanato:'M16 5a6 6 0 0 1 6 6c0 3-2 4.5-2 7h-8c0-2.5-2-4-2-7a6 6 0 0 1 6-6z M12 18h8l-1 4h-6z M14 25h4',
  care:'M16 27s-9-5.5-9-12.5A6 6 0 0 1 16 10a6 6 0 0 1 9 4.5C25 21.5 16 27 16 27z',
};

export default function ServiceIcon({type,size=28}:{type:keyof typeof paths;size?:number}){
  const d = paths[type];
  if(!d) return null;
  return (
    <svg className="serviceIcon" width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d}/>
    </svg>
  );
}
